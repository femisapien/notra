import { verifyDomainConnectCallback } from "@notra/sites-server/domain-connect";
import type { NextRequest } from "next/server";

import {
  finishDnsCallback,
  loadDnsCallbackSite,
} from "@/lib/sites/dns-callback";
import type {
  SiteDomainConnectOutcome,
  SiteDomainConnectRouteContext,
} from "@/types/sites";

/**
 * Domain Connect sends the browser back here after the customer approved (or
 * cancelled) the DNS change. The token lives in the path because Cloudflare
 * drops `state`. Errors arrive as OAuth-style `error` / `error_description`.
 */
export async function GET(
  request: NextRequest,
  { params }: SiteDomainConnectRouteContext
) {
  const claims = verifyDomainConnectCallback((await params).token);
  if (!claims) {
    return new Response(
      "This DNS setup link expired. Start again from the Domains tab.",
      {
        status: 400,
      }
    );
  }
  const loaded = await loadDnsCallbackSite(request, claims.siteId);
  if (loaded instanceof Response) {
    return loaded;
  }

  const error = request.nextUrl.searchParams.get("error");
  const description =
    request.nextUrl.searchParams.get("error_description") ?? "";
  let outcome: SiteDomainConnectOutcome = "success";
  if (error) {
    outcome =
      error === "access_denied" && description.startsWith("user_cancel")
        ? "cancelled"
        : "error";
  }
  return finishDnsCallback({
    request,
    site: loaded.site,
    domainId: claims.domainId,
    userId: loaded.userId,
    outcome,
  });
}
