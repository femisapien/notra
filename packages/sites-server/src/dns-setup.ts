import { domainConnectForDomain } from "./domain-connect";
import { requireSiteDomain } from "./domains";
import type {
  DnsSetupForDomainParams,
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
export async function dnsSetupForDomain({
  site,
  domainId,
}: DnsSetupForDomainParams): Promise<DomainConnectResult> {
  const domain = await requireSiteDomain(site.id, domainId);
  const result = await domainConnectForDomain({ siteId: site.id, domain });
  if (result.status !== "unsupported" || result.providerName) {
    return result;
  }
  const zone = await findVercelZone(domain.hostname);
  if (!zone) {
    return result;
  }
  const config = getVercelDnsConfig();
  if (!config || domain.verificationRecords.length === 0) {
    return { status: "unsupported", providerName: "Vercel", zone };
  }
  return {
    status: "ready",
    providerName: "Vercel",
    applyUrl: vercelInstallUrl(config, { siteId: site.id, domainId }),
  };
}
