import { db } from "@notra/db/drizzle";
import { siteDomains } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";

import { domainConnectForDomain } from "./domain-connect";
import type {
  DomainConnectForDomainParams,
  DomainConnectResult,
} from "./types/domain-connect";
import {
  findVercelZone,
  getVercelDnsConfig,
  vercelInstallUrl,
} from "./vercel-dns";

/**
 * One-click DNS for a pending custom subdomain, from whichever provider can do
 * it: Domain Connect (Cloudflare, GoDaddy, …) first, else Vercel DNS through
 * the Notra integration. Otherwise the provider and zone still label the
 * manual records.
 */
export async function dnsSetupForDomain(
  params: DomainConnectForDomainParams
): Promise<DomainConnectResult> {
  const result = await domainConnectForDomain(params);
  if (result.status !== "unsupported" || result.providerName) {
    return result;
  }
  const [domain] = await db
    .select({
      hostname: siteDomains.hostname,
      records: siteDomains.verificationRecords,
    })
    .from(siteDomains)
    .where(
      and(
        eq(siteDomains.id, params.domainId),
        eq(siteDomains.siteId, params.site.id)
      )
    )
    .limit(1);
  const zone = domain ? await findVercelZone(domain.hostname) : null;
  if (!(domain && zone)) {
    return result;
  }
  const config = getVercelDnsConfig();
  if (!config || domain.records.length === 0) {
    return { status: "unsupported", providerName: "Vercel", zone };
  }
  return {
    status: "ready",
    providerName: "Vercel",
    applyUrl: vercelInstallUrl(config, {
      siteId: params.site.id,
      domainId: params.domainId,
    }),
  };
}
