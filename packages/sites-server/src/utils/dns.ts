import { Resolver } from "node:dns/promises";

import { DNS_RESOLVER_TIMEOUT_MS } from "../constants/domains";

export function createDnsResolver(): Resolver {
  return new Resolver({ timeout: DNS_RESOLVER_TIMEOUT_MS, tries: 2 });
}

/** Lowercase, without the trailing root dot. */
export function normalizeDnsName(name: string): string {
  return name.toLowerCase().replace(/\.$/, "");
}

/**
 * Parent zones to try, closest first: `docs.blog.acme.co.uk` → `blog.acme.co.uk`,
 * `acme.co.uk`, `co.uk`. The hostname itself is skipped (its CNAME cannot be a zone apex).
 */
export function zoneCandidates(hostname: string): string[] {
  const labels = normalizeDnsName(hostname).split(".");
  const candidates: string[] = [];
  for (let start = 1; labels.length - start >= 2; start += 1) {
    candidates.push(labels.slice(start).join("."));
  }
  return candidates;
}

/** `blog.acme.com` in zone `acme.com` → `blog`; the apex is the empty name. */
export function relativeDnsName(name: string, zone: string): string {
  const host = normalizeDnsName(name);
  return host === zone ? "" : host.slice(0, -(zone.length + 1));
}
