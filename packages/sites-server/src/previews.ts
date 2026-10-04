import { db } from "@notra/db/drizzle";
import { siteDeployments } from "@notra/db/schema";
import { SITE_DEPLOYMENT_IN_PROGRESS_STATUSES } from "@notra/sites-core/constants/sites";
import { and, eq, inArray, isNotNull } from "drizzle-orm";

import { readLiveDeployments } from "./activation";
import { enqueuePreviewRemoval } from "./deployments";
import type { Site } from "./types/sites";

/**
 * Turning previews off closes every preview like a closed pull request: it
 * stops being served, its running builds are canceled, and the tombstone keeps
 * a late build from bringing it back. The next push after turning previews on
 * builds them again.
 */
export async function closeAllPreviews(site: Site): Promise<string[]> {
  const [live, building] = await Promise.all([
    readLiveDeployments(site.id),
    db
      .selectDistinct({ previewKey: siteDeployments.previewKey })
      .from(siteDeployments)
      .where(
        and(
          eq(siteDeployments.siteId, site.id),
          isNotNull(siteDeployments.previewKey),
          inArray(siteDeployments.status, [
            ...SITE_DEPLOYMENT_IN_PROGRESS_STATUSES,
          ])
        )
      ),
  ]);
  const keys = new Set(Object.keys(live.previews));
  for (const row of building) {
    if (row.previewKey) {
      keys.add(row.previewKey);
    }
  }
  const jobIds: string[] = [];
  for (const previewKey of keys) {
    jobIds.push(await enqueuePreviewRemoval(site.id, previewKey));
  }
  return jobIds;
}
