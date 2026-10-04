import type { GeoIngestSitePrefix } from "@notra/geo-core/types/geo";

/**
 * True when a Notra Site serves this URL. When the customer proxies
 * `acme.com/blog` to their site and also runs the SDK, both would report the
 * same page view; the site's own report is the one that counts.
 */
export function isServedBySite(
  url: URL,
  prefixes: GeoIngestSitePrefix[]
): boolean {
  const host = url.hostname.toLowerCase();
  const path = url.pathname;
  return prefixes.some(
    (prefix) =>
      prefix.host === host &&
      prefix.mounts.some(
        (mount) =>
          mount === "/" || path === mount || path.startsWith(`${mount}/`)
      )
  );
}
