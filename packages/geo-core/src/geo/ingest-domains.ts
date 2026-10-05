import { redis } from "@notra/ai/utils/redis";
import { db } from "@notra/db/drizzle";
import { geoSettings } from "@notra/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { Effect } from "effect";

import { GEO_MAX_DOMAINS } from "../constants/geo";
import {
  GEO_IGNORE_PENDING_DOMAIN_SCRIPT,
  GEO_PENDING_DOMAIN_LIMIT,
  GEO_PENDING_DOMAIN_TTL_SECONDS,
} from "../constants/ingest-domains";
import { loadIngestAllowedHosts } from "../ingest/hosts";
import type { GeoScopeInput } from "../types/geo";
import type {
  GeoIngestDomainActionInput,
  GeoIngestDomainsResponse,
} from "../types/ingest-domains";
import {
  matchesProjectHost,
  normalizeProjectDomain,
} from "../utils/geo-project-domains";
import { ingestDomainKeys } from "../utils/ingest-domain-keys";
import { geoDb } from "./effect";
import { GeoSettingsTrackingError } from "./errors";
import { invalidateGeoIngestHostsCache } from "./ingest-hosts-cache";
import { resolveGeoScope } from "./projects";

export const listPendingIngestDomains = Effect.fn("geo.ingestDomainsList")(
  function* (input: GeoScopeInput) {
    const scope = yield* resolveGeoScope(input);
    const client = redis;
    if (!(client && scope.projectId)) {
      return { domains: [] } satisfies GeoIngestDomainsResponse;
    }
    const keys = ingestDomainKeys(scope.organizationId, scope.projectId);
    const domains = yield* geoDb("pending domains lookup failed", () =>
      client.zrange<string[]>(
        keys.pending,
        Date.now() - GEO_PENDING_DOMAIN_TTL_SECONDS * 1000,
        "+inf",
        { byScore: true, count: GEO_PENDING_DOMAIN_LIMIT, offset: 0 }
      )
    );
    const allowed = yield* Effect.promise(() =>
      loadIngestAllowedHosts({
        organizationId: scope.organizationId,
        projectId: scope.projectId,
        generation: 1,
      })
    );
    return {
      domains: domains.filter(
        (domain) =>
          normalizeProjectDomain(domain) === domain &&
          !matchesProjectHost(domain, allowed ?? [])
      ),
    };
  }
);

export const actOnPendingIngestDomain = Effect.fn("geo.ingestDomainAction")(
  function* (input: GeoIngestDomainActionInput) {
    const scope = yield* resolveGeoScope(input);
    const client = redis;
    const domain = normalizeProjectDomain(input.domain);
    if (!(client && scope.projectId && domain)) {
      return yield* Effect.fail(
        new GeoSettingsTrackingError({
          message: "Domain suggestions are unavailable",
        })
      );
    }
    const projectId = scope.projectId;
    const keys = ingestDomainKeys(scope.organizationId, projectId);
    const seen = yield* geoDb("pending domain lookup failed", () =>
      client.zscore(keys.pending, domain)
    );
    if (
      seen === null ||
      Number(seen) < Date.now() - GEO_PENDING_DOMAIN_TTL_SECONDS * 1000
    ) {
      return yield* Effect.fail(
        new GeoSettingsTrackingError({
          message: "This domain suggestion is no longer available",
        })
      );
    }
    if (input.action === "ignore") {
      yield* geoDb("domain ignore failed", () =>
        client.eval(
          GEO_IGNORE_PENDING_DOMAIN_SCRIPT,
          [keys.pending, keys.ignored],
          [domain]
        )
      );
      return { success: true };
    }
    const rows = yield* geoDb("domain add failed", () =>
      db
        .update(geoSettings)
        .set({
          domains: sql`CASE WHEN ${domain} = ANY(${geoSettings.domains}) THEN ${geoSettings.domains} ELSE array_append(${geoSettings.domains}, ${domain}) END`,
        })
        .where(
          and(
            eq(geoSettings.organizationId, scope.organizationId),
            eq(geoSettings.projectId, projectId),
            sql`(${domain} = ANY(${geoSettings.domains}) OR cardinality(${geoSettings.domains}) < ${GEO_MAX_DOMAINS})`
          )
        )
        .returning({ id: geoSettings.id })
    );
    if (rows.length === 0) {
      return yield* Effect.fail(
        new GeoSettingsTrackingError({
          message: `Set up GEO tracking and keep at most ${GEO_MAX_DOMAINS} additional domains`,
        })
      );
    }
    yield* Effect.promise(() =>
      invalidateGeoIngestHostsCache(scope.organizationId, projectId)
    );
    yield* Effect.promise(() =>
      client.zrem(keys.pending, domain).catch(() => null)
    );
    return { success: true };
  }
);
