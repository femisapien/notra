import { redis } from "@notra/ai/utils/redis";
import { db } from "@notra/db/drizzle";
import { projects } from "@notra/db/schema";
import {
  WEB_TRACKING_CACHE_PREFIX,
  WEB_TRACKING_CACHE_TTL_SECONDS,
  WEB_TRACKING_MEMORY_TTL_MS,
} from "@notra/geo-core/constants/web-analytics";
import type { GeoIngestIdentity } from "@notra/geo-core/types/geo";
import { and, eq } from "drizzle-orm";

const memory = new Map<string, { value: boolean; until: number }>();

/**
 * Whether human page views are kept for this token. Notra Sites always count
 * their visitors; an SDK project only after it switched on visitor tracking.
 * Without that switch people are dropped at ingest, exactly as before.
 */
export async function isVisitorTrackingEnabled(
  identity: GeoIngestIdentity
): Promise<boolean> {
  if (identity.site) {
    return true;
  }
  const { projectId } = identity;
  if (!projectId) {
    return false;
  }
  const key = `${WEB_TRACKING_CACHE_PREFIX}:${projectId}`;
  const hit = memory.get(key);
  if (hit && hit.until > Date.now()) {
    return hit.value;
  }
  let value: boolean | null = null;
  const client = redis;
  if (client) {
    const cached = await client.get<{ value: boolean }>(key).catch(() => null);
    if (cached && typeof cached === "object" && "value" in cached) {
      value = cached.value;
    }
  }
  if (value === null) {
    const project = await db.query.projects.findFirst({
      columns: { trackVisitors: true },
      where: and(
        eq(projects.id, projectId),
        eq(projects.organizationId, identity.organizationId)
      ),
    });
    value = project?.trackVisitors ?? false;
    await client
      ?.set(key, { value }, { ex: WEB_TRACKING_CACHE_TTL_SECONDS })
      .catch(() => null);
  }
  memory.set(key, { value, until: Date.now() + WEB_TRACKING_MEMORY_TTL_MS });
  return value;
}

/**
 * Called when the switch changes. Writes the new value rather than deleting
 * it, so an ingest read that started before the change can't put the old
 * value back for a whole TTL.
 */
export async function rememberVisitorTracking(
  projectId: string,
  value: boolean
): Promise<void> {
  const key = `${WEB_TRACKING_CACHE_PREFIX}:${projectId}`;
  memory.set(key, { value, until: Date.now() + WEB_TRACKING_MEMORY_TTL_MS });
  await redis
    ?.set(key, { value }, { ex: WEB_TRACKING_CACHE_TTL_SECONDS })
    .catch(() => null);
}
