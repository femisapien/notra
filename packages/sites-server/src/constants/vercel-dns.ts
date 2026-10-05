/** Dashboard route the Vercel integration redirects back to after install. */
export const VERCEL_DNS_CALLBACK_PATH = "/sites/vercel-dns";
export const VERCEL_API_URL = "https://api.vercel.com";
/** Vercel DNS nameservers all live under this domain (ns1.vercel-dns.com, …). */
export const VERCEL_NAMESERVER_SUFFIX = ".vercel-dns.com";
export const VERCEL_DNS_HTTP_TIMEOUT_MS = 8000;
export const VERCEL_DNS_RECORD_TTL_SECONDS = 60;
export const VERCEL_DNS_RECORD_COMMENT = "Notra Sites";
/** Keeps install-state tokens from verifying as Domain Connect tokens and back. */
export const VERCEL_DNS_STATE_LABEL = "vercel-dns.";
