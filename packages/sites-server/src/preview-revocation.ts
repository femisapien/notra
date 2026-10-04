import { db } from "@notra/db/drizzle";
import { members, sites } from "@notra/db/schema";
import type { PreviewRevocationScope } from "@notra/sites-core/types/preview-token";
import { revokePreviewSessionsInState } from "@notra/sites-core/utils/preview-revocation";
import { eq, inArray } from "drizzle-orm";

import { mutateServingState, readServingState } from "./state";
import type { ServingSiteRef } from "./types/state";

async function revokeOnSite(
  site: ServingSiteRef,
  userId: string,
  scope: PreviewRevocationScope
): Promise<void> {
  // A site without serving state has no previews to protect; don't create one.
  if (!(await readServingState(site.id))) {
    return;
  }
  const nowMs = Date.now();
  await mutateServingState(site, (state) => ({
    write: {
      ...state,
      revokedSessions: revokePreviewSessionsInState(
        state.revokedSessions,
        userId,
        scope,
        nowMs
      ),
      updatedAt: new Date(nowMs).toISOString(),
    },
    result: undefined,
  }));
}

async function revokeOnSites(
  rows: ServingSiteRef[],
  userId: string,
  scope: PreviewRevocationScope
): Promise<void> {
  const results = await Promise.allSettled(
    rows.map((site) => revokeOnSite(site, userId, scope))
  );
  const failed = results.filter((result) => result.status === "rejected");
  if (failed.length > 0) {
    throw new AggregateError(
      failed.map((result) => (result as PromiseRejectedResult).reason),
      `Could not revoke preview sessions on ${failed.length} site(s)`
    );
  }
}

/**
 * A member left or was removed from an organization: their preview sessions
 * and the share links they created stop working on every site of it, within
 * the worker's state re-read (≤ 5 s).
 */
export async function revokeOrganizationMemberPreviewAccess(
  organizationId: string,
  userId: string
): Promise<void> {
  const rows = await db
    .select({ id: sites.id, slug: sites.slug })
    .from(sites)
    .where(eq(sites.organizationId, organizationId));
  await revokeOnSites(rows, userId, "access_lost");
}

/** The user signed out of the dashboard: end their preview sessions on every site they can reach. */
export async function revokeUserPreviewSessions(userId: string): Promise<void> {
  const organizations = db
    .select({ organizationId: members.organizationId })
    .from(members)
    .where(eq(members.userId, userId));
  const rows = await db
    .select({ id: sites.id, slug: sites.slug })
    .from(sites)
    .where(inArray(sites.organizationId, organizations));
  await revokeOnSites(rows, userId, "signed_out");
}
