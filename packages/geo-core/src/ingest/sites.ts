import { redis } from "@notra/ai/utils/redis";
import { db } from "@notra/db/drizzle";
import { projects, sites } from "@notra/db/schema";
import {
  GEO_INGEST_IDENTITY_ACTIVE_TTL_SECONDS,
  GEO_INGEST_SITE_INACTIVE_TTL_SECONDS,
  GEO_INGEST_ORGANIZATION_SITES_CACHE_PREFIX,
  GEO_INGEST_SITE_CACHE_PREFIX,
  GEO_INGEST_SITE_MEMORY_MAX_ENTRIES,
  GEO_INGEST_SITE_MEMORY_TTL_MS,
} from "@notra/geo-core/constants/geo";
import { GEO_PROJECTS_OLDEST_ORDER } from "@notra/geo-core/constants/geo-projects";
import type {
  GeoIngestSite,
  GeoIngestSitePrefix,
} from "@notra/geo-core/types/geo";
import { listMountedAreas } from "@notra/sites-core/utils/mounts";
import { eq } from "drizzle-orm";

/**
 * Every page view of a site reaches ingest, humans included, and the token is
 * resolved before classification. Hot sites are answered from memory so
 * dropped human traffic stays free of I/O.
 */
const memory = new Map<string, { site: GeoIngestSite | null; until: number }>();

/** Sites live on one host each; the worker reports every page under its public origin. */
function originHost(publicOrigin: string): string | null {
  try {
    return new URL(publicOrigin).hostname.toLowerCase();
  } catch {
    return null;
  }
}

async function cached<T>(
  key: string,
  load: () => Promise<T | null>
): Promise<T | null> {
  const client = redis;
  if (client) {
    const hit = await client.get<{ value: T | null }>(key).catch(() => null);
    if (hit && typeof hit === "object" && "value" in hit) {
      return hit.value;
    }
  }
  const value = await load();
  if (client) {
    await client
      .set(
        key,
        { value },
        {
          ex:
            value === null
              ? GEO_INGEST_SITE_INACTIVE_TTL_SECONDS
              : GEO_INGEST_IDENTITY_ACTIVE_TTL_SECONDS,
        }
      )
      .catch(() => null);
  }
  return value;
}

/**
 * The site a site token names, or null when it is gone, its organization has
 * no project to attribute traffic to, or it is taken down. A site without a
 * project counts for the organization's oldest one, like a legacy
 * organization token. Deleting the site revokes its token
 * within the cache TTL.
 */
export async function loadIngestSite(
  siteId: string
): Promise<GeoIngestSite | null> {
  const now = Date.now();
  const hit = memory.get(siteId);
  if (hit && hit.until > now) {
    return hit.site;
  }
  const site = await lookupIngestSite(siteId);
  if (memory.size >= GEO_INGEST_SITE_MEMORY_MAX_ENTRIES) {
    memory.clear();
  }
  memory.set(siteId, { site, until: now + GEO_INGEST_SITE_MEMORY_TTL_MS });
  return site;
}

function lookupIngestSite(siteId: string): Promise<GeoIngestSite | null> {
  return cached(`${GEO_INGEST_SITE_CACHE_PREFIX}:${siteId}`, async () => {
    const site = await db.query.sites.findFirst({
      columns: {
        id: true,
        organizationId: true,
        projectId: true,
        publicOrigin: true,
        status: true,
      },
      where: eq(sites.id, siteId),
    });
    const host = site ? originHost(site.publicOrigin) : null;
    if (!(site && host) || site.status !== "active") {
      return null;
    }
    const projectId =
      site.projectId ??
      (
        await db.query.projects.findFirst({
          columns: { id: true },
          where: eq(projects.organizationId, site.organizationId),
          orderBy: GEO_PROJECTS_OLDEST_ORDER,
        })
      )?.id;
    if (!projectId) {
      return null;
    }
    return {
      id: site.id,
      organizationId: site.organizationId,
      projectId,
      hosts: [host],
    };
  });
}

/** Host and mount paths of every site in the organization. Null when the lookup failed. */
export async function loadOrganizationSitePrefixes(
  organizationId: string
): Promise<GeoIngestSitePrefix[] | null> {
  try {
    return await cached(
      `${GEO_INGEST_ORGANIZATION_SITES_CACHE_PREFIX}:${organizationId}`,
      async () => {
        const rows = await db
          .select({ publicOrigin: sites.publicOrigin, mounts: sites.mounts })
          .from(sites)
          .where(eq(sites.organizationId, organizationId));
        const prefixes: GeoIngestSitePrefix[] = [];
        for (const row of rows) {
          const host = originHost(row.publicOrigin);
          if (host) {
            prefixes.push({
              host,
              mounts: listMountedAreas(row.mounts).map(({ mount }) => mount),
            });
          }
        }
        return prefixes;
      }
    );
  } catch {
    return null;
  }
}
