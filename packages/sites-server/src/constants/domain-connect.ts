/** Fixed in the published template; Domain Connect is only offered when this environment uses it. */
export const DOMAIN_CONNECT_CNAME_TARGET = "cname.notra.site";
/** Name of the template variable carrying the Cloudflare for SaaS ownership token. */
export const DOMAIN_CONNECT_OWNERSHIP_VARIABLE = "ownership";
/** Dashboard route the DNS provider redirects back to: `{path}/{token}`. */
export const DOMAIN_CONNECT_CALLBACK_PATH = "/sites/domain-connect";

export const OWNERSHIP_RECORD_PREFIX = "_cf-custom-hostname.";
export const DOMAIN_CONNECT_HTTP_TIMEOUT_MS = 5000;
/** A `_domainconnect` TXT value: a host, optionally with port and path. */
export const DOMAIN_CONNECT_DISCOVERY_HOST =
  /^[a-z0-9.-]+(?::\d+)?(?:\/[\w.~%/-]*)?$/i;
export const CALLBACK_TOKEN_SECONDS = 2 * 60 * 60;
export const CALLBACK_TOKEN_LABEL = "domain-connect.";
export const PUBLIC_KEY_CHUNK_LENGTH = 200;
/** Query parameters with protocol meaning; template variables must not use these names. */
export const DOMAIN_CONNECT_RESERVED_PARAMS = new Set([
  "domain",
  "host",
  "redirect_uri",
  "state",
  "key",
  "sig",
  "providerName",
  "serviceName",
  "groupId",
]);
