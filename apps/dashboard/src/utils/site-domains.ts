import { SITE_DOMAIN_CONNECT_OUTCOMES } from "@/constants/sites";
import type {
  SiteDomain,
  SiteDomainChipStatus,
  SiteDomainConnectOutcome,
  SiteMounts,
} from "@/types/sites";
import { mountedPaths } from "@/utils/site-proxy-recipes";

/** What the status chip says; `pending` splits into DNS or proxy setup by kind. */
export function siteDomainChipStatus(domain: SiteDomain): SiteDomainChipStatus {
  if (domain.status === "pending") {
    return domain.kind === "proxy" ? "proxyRequired" : "dnsRequired";
  }
  return domain.status;
}

/** Where a custom domain serves the site; proxied domains serve it below the first mount. */
export function siteDomainUrl(domain: SiteDomain, mounts: SiteMounts): string {
  const firstPath = mountedPaths(mounts)[0];
  const path = domain.kind === "proxy" && firstPath !== "/" ? firstPath : "";
  return `https://${domain.hostname}${path ?? ""}`;
}

/** The Domain Connect outcome in a query parameter, or null when it isn't one. */
export function parseSiteDomainConnectOutcome(
  value: string | null
): SiteDomainConnectOutcome | null {
  return (
    SITE_DOMAIN_CONNECT_OUTCOMES.find((outcome) => outcome === value) ?? null
  );
}
