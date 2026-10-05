import { SITE_CSP_STATIC_DIRECTIVES } from "@notra/sites-core/constants/security";
import type { SiteContentSecurityPolicyParams } from "@notra/sites-core/types/site-integrations";
import { integrationCspSources } from "@notra/sites-core/utils/integrations";

function sortedUnique(values: Iterable<string>): string[] {
  return [...new Set(values)].sort();
}

/**
 * The Content-Security-Policy for every HTML page of a deployment, or null
 * when the site turned it off. Scripts: same origin, the exact inline scripts
 * of the build (by hash), the integrations' hosts and `security.allowedOrigins`.
 * Images, styles, fonts and frames stay open so posts can embed external media.
 * Workers fall back to script-src unless an integration needs more (a chat
 * widget running blob: workers), then worker-src extends the script sources.
 */
export function buildSiteContentSecurityPolicy(
  params: SiteContentSecurityPolicyParams
): string | null {
  if (!params.security.contentSecurityPolicy) {
    return null;
  }
  const integrations = integrationCspSources(params.integrations);
  const allowed = params.security.allowedOrigins;
  const scriptOrigins = [
    ...integrations.scriptSrc,
    // WebSocket origins can only ever be connected to.
    ...allowed.filter((origin) => origin.startsWith("https://")),
  ];
  const scriptSrc = [
    "'self'",
    ...sortedUnique(params.scriptHashes).map((hash) => `'sha256-${hash}'`),
    ...sortedUnique(scriptOrigins),
  ];
  const connectSrc = [
    "'self'",
    ...sortedUnique([...integrations.connectSrc, ...allowed]),
  ];
  // Setting worker-src replaces the script-src fallback, so it repeats those origins.
  const workerSrc =
    integrations.workerSrc.length > 0
      ? [
          "'self'",
          ...sortedUnique([...scriptOrigins, ...integrations.workerSrc]),
        ]
      : null;
  return [
    `script-src ${scriptSrc.join(" ")}`,
    `connect-src ${connectSrc.join(" ")}`,
    ...(workerSrc ? [`worker-src ${workerSrc.join(" ")}`] : []),
    ...SITE_CSP_STATIC_DIRECTIVES,
  ].join("; ");
}
