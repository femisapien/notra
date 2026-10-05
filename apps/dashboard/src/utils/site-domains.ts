import {
  SITE_CLOUDFLARE_PROVIDER_PATTERN,
  SITE_DOMAIN_CONNECT_OUTCOMES,
  SITE_DOMAIN_URL_SCHEME_PATTERN,
} from "@/constants/sites";
import type {
  SiteDomain,
  SiteDomainChipStatus,
  SiteDomainConnectOutcome,
  SiteDomainKind,
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

/**
 * How a typed domain most likely connects: a path (acme.com/blog) or a bare
 * apex (acme.com) means the customer's own site forwards paths, anything
 * deeper (blog.acme.com) gets a DNS record. Null until there is a hostname.
 */
export function detectSiteDomainKind(value: string): SiteDomainKind | null {
  const [host = "", ...path] = value
    .trim()
    .replace(SITE_DOMAIN_URL_SCHEME_PATTERN, "")
    .split("/");
  const labels = host.split(".").filter(Boolean);
  if (labels.length < 2) {
    return null;
  }
  if (path.some(Boolean) || labels.length === 2) {
    return "proxy";
  }
  return "subdomain";
}

/**
 * The provider's DNS records page for a zone, where one is known. Cloudflare
 * resolves `:account` itself after login.
 */
export function siteDnsProviderDashboardUrl(
  providerName: string | undefined,
  zone: string | undefined
): string | null {
  if (!(providerName && zone)) {
    return null;
  }
  if (SITE_CLOUDFLARE_PROVIDER_PATTERN.test(providerName)) {
    return `https://dash.cloudflare.com/?to=/:account/${encodeURIComponent(zone)}/dns/records`;
  }
  return null;
}
