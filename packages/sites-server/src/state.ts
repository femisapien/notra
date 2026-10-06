import { db } from "@notra/db/drizzle";
import { sites } from "@notra/db/schema";
import { buildGeoIngestSiteToken } from "@notra/geo-core/geo/ingest";
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

import { JSON_CONTENT_TYPE } from "./constants/content-types";
import { CAS_ATTEMPTS, CAS_BACKOFF_MS } from "./constants/state";
import { R2PreconditionFailedError, SiteHostConflictError } from "./errors";
import { r2DeleteKey, r2GetText, r2Put } from "./r2";
import type {
  ServingPreviewAccess,
  ServingSiteRef,
  ServingStateMutation,
  ServingStateObject,
} from "./types/state";

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

/**
 * The site's preview access as the database has it now. Read on every state
 * write attempt, so a build that started before an access change never
 * writes the old value back.
 */
async function readPreviewAccessFromDb(
  siteId: string
): Promise<ServingPreviewAccess> {
  const [row] = await db
    .select({
      previewPassword: sites.previewPassword,
      previewVisibility: sites.previewVisibility,
    })
    .from(sites)
    .where(eq(sites.id, siteId))
    .limit(1);
  return {
    previewPassword: row?.previewPassword ?? null,
    previewVisibility: row?.previewVisibility ?? null,
  };
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
  mutate: (
    state: SiteServingState,
    access: Pick<ServingPreviewAccess, "previewVisibility">
  ) => ServingStateMutation<T>
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
    // Preview access is read before mutating: if it changes after this read,
    // the change's own state write moves the ETag and this attempt retries.
    const { previewPassword, previewVisibility } =
      await readPreviewAccessFromDb(site.id);
    const outcome = mutate(state, { previewVisibility });
    // The preview password and the traffic token are derived on every write,
    // so a lost or stale state.json gets them back with the next state write.
    const trafficToken = buildGeoIngestSiteToken(site.id);
    const derivedInSync =
      samePreviewPassword(state.previewPassword, previewPassword) &&
      state.trafficToken === trafficToken;
    if ("skip" in outcome && (!current || derivedInSync)) {
      return outcome.result;
    }
    const write: SiteServingState = {
      ...("skip" in outcome ? state : outcome.write),
      previewPassword,
      trafficToken,
    };
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
      await new Promise((resolve) =>
        setTimeout(resolve, CAS_BACKOFF_MS * 2 ** attempt)
      );
    }
  }
  throw new Error(
    `Could not update serving state for ${site.id}: too much contention`
  );
}

/** Writes the new state only when the activation went through. */
function writeIfActivated<
  T extends ProductionActivationResult | PreviewActivationResult,
>(outcome: T): ServingStateMutation<T> {
  return outcome.outcome === "activated"
    ? { write: outcome.state, result: outcome }
    : { skip: true, result: outcome };
}

export async function activateProductionDeployment(
  site: ServingSiteRef,
  pointer: ProductionPointerInput
) {
  return await mutateServingState(site, (state) =>
    writeIfActivated(activateProductionInState(state, pointer, new Date()))
  );
}

/**
 * Points a preview at a finished build. Its visibility is the site's current
 * one from the database; `pointer.visibility` only covers a missing site row.
 */
export async function activatePreviewDeployment(
  site: ServingSiteRef,
  previewKey: string,
  pointer: Omit<SitePreviewPointer, "activatedAt">
) {
  return await mutateServingState(site, (state, access) =>
    writeIfActivated(
      activatePreviewInState(
        state,
        previewKey,
        {
          ...pointer,
          visibility: access.previewVisibility ?? pointer.visibility,
        },
        new Date()
      )
    )
  );
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
 * Re-mirrors the database's preview access and the traffic token into an
 * existing state.json. Every state write does this anyway; this is the repair
 * path when nothing else writes.
 */
export async function syncServingPreviewAccess(site: ServingSiteRef) {
  await mutateServingState(site, () => ({ skip: true, result: undefined }));
}

/** The host record stored for `hostname`, or null when there is none (or it is unreadable). */
async function readHostRecord(
  hostname: string
): Promise<SiteHostRecord | null> {
  const existing = await r2GetText(SITE_R2_KEYS.host(hostname));
  if (!existing) {
    return null;
  }
  const parsed = siteHostRecordSchema.safeParse(JSON.parse(existing.text));
  return parsed.success ? parsed.data : null;
}

/**
 * Host records map a hostname to a site. They are created only once (If-None-Match)
 * so one tenant can never take over a hostname another tenant registered.
 */
export async function claimHostRecord(
  hostname: string,
  record: Omit<SiteHostRecord, "version">
): Promise<void> {
  const body = JSON.stringify({
    version: 1,
    ...record,
  } satisfies SiteHostRecord);
  try {
    await r2Put(SITE_R2_KEYS.host(hostname), body, {
      contentType: JSON_CONTENT_TYPE,
      cacheControl: "no-store",
      ifNoneMatch: "*",
    });
  } catch (error) {
    if (!(error instanceof R2PreconditionFailedError)) {
      throw error;
    }
    const existing = await readHostRecord(hostname);
    if (existing?.siteId === record.siteId && existing.kind === record.kind) {
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
  if ((await readHostRecord(hostname))?.siteId === siteId) {
    await r2DeleteKey(SITE_R2_KEYS.host(hostname));
  }
}
