import { STARTER_MAX_URL_LENGTH } from "../constants/starter";
import type { ResolveLinkUrlOptions } from "../types/starter";

const URL_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;
const HTTP_SCHEME = /^http:\/\//i;
/** Quotes and braces would need escaping in MDX attributes. */
const MDX_UNSAFE_URL_CHARACTER = /["'<>{}`\\]/;

/** An absolute http(s)/mailto URL, or null for anchors, scripts and junk. */
export function resolveLinkUrl(
  href: string,
  baseUrl: string,
  options: ResolveLinkUrlOptions = {}
): string | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(trimmed, baseUrl);
  } catch {
    return null;
  }
  const allowed = options.httpsOnly
    ? url.protocol === "https:"
    : ["https:", "http:", "mailto:"].includes(url.protocol);
  if (!allowed || url.username || url.password) {
    return null;
  }
  url.hash = "";
  const value = url.href;
  if (
    value.length > STARTER_MAX_URL_LENGTH ||
    MDX_UNSAFE_URL_CHARACTER.test(value)
  ) {
    return null;
  }
  return value;
}

/** `https://` in front of a bare domain; plain http is upgraded, never fetched. */
export function normalizeWebsiteUrl(value: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }
  const withScheme = URL_SCHEME.test(trimmed)
    ? trimmed.replace(HTTP_SCHEME, "https://")
    : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

/** Hostname without a leading `www.`, or null for an unparsable URL. */
export function bareHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}
