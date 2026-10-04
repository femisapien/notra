import { SITE_R2_KEYS } from "@notra/sites-core/constants/sites";
import {
  siteHostRecordSchema,
  siteServingStateSchema,
} from "@notra/sites-core/schemas/deployment";
import type {
  SiteHostRecord,
  SitePreviewPassword,
  SitePreviewPointer,
  SiteServingState,
} from "@notra/sites-core/types/deployment";
import type {
  PreviewActivationResult,
  ProductionActivationResult,
  ProductionPointerInput,
} from "@notra/sites-core/types/serving-state";
import {
  activatePreviewInState,
  activateProductionInState,
  createInitialServingState,
  removePreviewFromState,
  setPreviewVisibilityInState,
} from "@notra/sites-core/utils/serving-state";
import { eq } from "drizzle-orm";

import { CAS_ATTEMPTS, JSON_CONTENT_TYPE } from "./constants/state";
import { R2PreconditionFailedError, r2DeleteKey, r2GetText, r2Put } from "./r2";
import type {
  ServingSiteRef,
  ServingStateMutation,
  ServingStateObject,
} from "./types/state";

export class SiteHostConflictError extends Error {
  readonly name = "SiteHostConflictError";
}

/** Field by field: jsonb and the schema order keys differently. */
function samePreviewPassword(
  a: SitePreviewPassword | null,
  b: SitePreviewPassword | null
): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  return (
    a.version === b.version &&
    a.hash === b.hash &&
    a.salt === b.salt &&
    a.iterations === b.iterations &&
    a.algorithm === b.algorithm &&
    a.updatedAt === b.updatedAt
  );
}

async function readPreviewPasswordFromDb(
  siteId: string
): Promise<SitePreviewPassword | null> {
  const [row] = await db
    .select({ previewPassword: sites.previewPassword })
    .from(sites)
    .where(eq(sites.id, siteId))
    .limit(1);
  return row?.previewPassword ?? null;
}

export async function readServingState(
  siteId: string
): Promise<ServingStateObject | null> {
  const object = await r2GetText(SITE_R2_KEYS.state(siteId));
  if (!object) {
    return null;
  }
  return {
    state: siteServingStateSchema.parse(JSON.parse(object.text)),
    etag: object.etag,
  };
}

/**
 * Read-modify-write of `state.json` guarded by the object's ETag. Concurrent
 * writers (two builds finishing, a rollback during a deploy) retry on 412
 * instead of overwriting each other.
 */
export async function mutateServingState<T>(
  site: ServingSiteRef,
  mutate: (state: SiteServingState) => ServingStateMutation<T>
): Promise<T> {
  for (let attempt = 0; attempt < CAS_ATTEMPTS; attempt += 1) {
    const current = await readServingState(site.id);
    const state =
      current?.state ??
      createInitialServingState({
        siteId: site.id,
        slug: site.slug,
        now: new Date(),
      });
    const outcome = mutate(state);
    if ("skip" in outcome) {
      return outcome.result;
    }
    try {
      await r2Put(SITE_R2_KEYS.state(site.id), JSON.stringify(write), {
        contentType: JSON_CONTENT_TYPE,
        cacheControl: "no-store",
        ...(current
          ? { ifMatch: current.etag }
          : { ifNoneMatch: "*" as const }),
      });
      return outcome.result;
    } catch (error) {
      if (!(error instanceof R2PreconditionFailedError)) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 50 * 2 ** attempt));
    }
  }
  throw new Error(
    `Could not update serving state for ${site.id}: too much contention`
  );
}

export async function activateProductionDeployment(
  site: ServingSiteRef,
  pointer: ProductionPointerInput
) {
  return await mutateServingState<ProductionActivationResult>(site, (state) => {
    const outcome = activateProductionInState(state, pointer, new Date());
    if (outcome.outcome === "activated") {
      return { write: outcome.state, result: outcome };
    }
    return { skip: true, result: outcome };
  });
}

export async function activatePreviewDeployment(
  site: ServingSiteRef,
  previewKey: string,
  pointer: Omit<SitePreviewPointer, "activatedAt">
) {
  return await mutateServingState<PreviewActivationResult>(site, (state) => {
    const outcome = activatePreviewInState(
      state,
      previewKey,
      pointer,
      new Date()
    );
    if (outcome.outcome === "activated") {
      return { write: outcome.state, result: outcome };
    }
    return { skip: true, result: outcome };
  });
}

export async function removePreviewDeployment(
  site: ServingSiteRef,
  previewKey: string,
  generation: number
) {
  await mutateServingState(site, (state) => ({
    write: removePreviewFromState(state, previewKey, generation, new Date()),
    result: undefined,
  }));
}

export async function setServingStatus(
  site: ServingSiteRef,
  status: SiteServingState["status"]
) {
  await mutateServingState(site, (state) => {
    if (state.status === status && state.slug === site.slug) {
      return { skip: true, result: undefined };
    }
    return {
      write: {
        ...state,
        status,
        slug: site.slug,
        updatedAt: new Date().toISOString(),
      },
      result: undefined,
    };
  });
}

export async function setServingPreviewVisibility(
  site: ServingSiteRef,
  visibility: SitePreviewPointer["visibility"]
) {
  await mutateServingState(site, (state) => ({
    write: setPreviewVisibilityInState(state, visibility, new Date()),
    result: undefined,
  }));
}

/**
 * Host records map a hostname to a site. They are created only once (If-None-Match)
 * so one tenant can never take over a hostname another tenant registered.
 */
export async function claimHostRecord(
  hostname: string,
  record: Omit<SiteHostRecord, "version">
): Promise<void> {
  const key = SITE_R2_KEYS.host(hostname);
  const body = JSON.stringify({
    version: 1,
    ...record,
  } satisfies SiteHostRecord);
  try {
    await r2Put(key, body, {
      contentType: JSON_CONTENT_TYPE,
      cacheControl: "no-store",
      ifNoneMatch: "*",
    });
  } catch (error) {
    if (!(error instanceof R2PreconditionFailedError)) {
      throw error;
    }
    const existing = await r2GetText(key);
    const parsed = existing
      ? siteHostRecordSchema.safeParse(JSON.parse(existing.text))
      : null;
    if (
      parsed?.success &&
      parsed.data.siteId === record.siteId &&
      parsed.data.kind === record.kind
    ) {
      return;
    }
    throw new SiteHostConflictError(
      `${hostname} already belongs to another site`
    );
  }
}

export async function releaseHostRecord(
  hostname: string,
  siteId: string
): Promise<void> {
  const key = SITE_R2_KEYS.host(hostname);
  const existing = await r2GetText(key);
  if (!existing) {
    return;
  }
  const parsed = siteHostRecordSchema.safeParse(JSON.parse(existing.text));
  if (parsed.success && parsed.data.siteId === siteId) {
    await r2DeleteKey(key);
  }
}
