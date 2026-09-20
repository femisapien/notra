import type { NextRequest } from "next/server";

/**
 * Browsers always send Origin on a cross-site POST, so this stops other sites
 * from spending our budget through their visitors. Scripts can forge it; the
 * rate limits are what bounds those.
 */
export function isSameOriginRequest(request: NextRequest): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite && fetchSite !== "same-origin") {
    return false;
  }

  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (!(origin && host)) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
