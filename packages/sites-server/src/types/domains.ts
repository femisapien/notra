import type { siteDomains } from "@notra/db/schema";

export type SiteDomain = typeof siteDomains.$inferSelect;

export interface AddSiteDomainInput {
  kind: SiteDomain["kind"];
  value: string;
}

export type ProxyProbeResult = { ok: true } | { ok: false; error: string };

export interface RefreshSiteDomainResult {
  domain: SiteDomain;
  rebuildJobId: string | null;
}
