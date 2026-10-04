/**
 * Inline scripts allowed by hash in the Content-Security-Policy, across all
 * pages of a deployment. Each hash adds ~55 bytes to every HTML response.
 */
export const SITE_CSP_MAX_SCRIPT_HASHES = 100;
export const SITE_CSP_MAX_LENGTH = 16_384;
export const SITE_CSP_MAX_ALLOWED_ORIGINS = 32;

/** Directives that do not depend on the deployment. */
export const SITE_CSP_STATIC_DIRECTIVES = [
  "object-src 'none'",
  "base-uri 'self'",
] as const;
