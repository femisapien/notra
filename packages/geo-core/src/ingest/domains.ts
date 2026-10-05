import { redis } from "@notra/ai/utils/redis";
import { Effect } from "effect";

import {
  GEO_PENDING_DOMAIN_LIMIT,
  GEO_PENDING_DOMAIN_TTL_SECONDS,
  GEO_RECORD_PENDING_DOMAIN_SCRIPT,
} from "../constants/ingest-domains";
import { resolveGeoScope } from "../geo/projects";
import type { GeoIngestIdentity } from "../types/geo";
import { normalizeProjectDomain } from "../utils/geo-project-domains";
import { ingestDomainKeys } from "../utils/ingest-domain-keys";

export async function recordPendingIngestDomain(
  identity: GeoIngestIdentity,
  host: string
): Promise<void> {
  const domain = normalizeProjectDomain(host);
  if (!(redis && domain)) {
    return;
  }
  const projectId =
    identity.projectId ??
    (
      await Effect.runPromise(
        resolveGeoScope({ organizationId: identity.organizationId })
      )
    ).projectId;
  if (!projectId) {
    return;
  }
  const keys = ingestDomainKeys(identity.organizationId, projectId);
  const now = Date.now();
  await redis.eval(
    GEO_RECORD_PENDING_DOMAIN_SCRIPT,
    [keys.pending, keys.ignored],
    [
      domain,
      now,
      GEO_PENDING_DOMAIN_LIMIT,
      now - GEO_PENDING_DOMAIN_TTL_SECONDS * 1000,
      GEO_PENDING_DOMAIN_TTL_SECONDS,
    ]
  );
}
