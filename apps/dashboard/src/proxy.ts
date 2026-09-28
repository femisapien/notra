import { authkit, handleAuthkitProxy } from "@workos-inc/authkit-nextjs";
import { NextResponse, type NextRequest } from "next/server";

import { NON_DASHBOARD_PATH } from "@/constants/auth-routes";
import {
  evaluateLocalDevAuth,
  isLocalDevAuthEnabled,
  localDevAuthBlockedMessage,
} from "@/utils/local-dev-auth";

function localDevProxy(request: NextRequest) {
  // NextRequest has no trusted peer IP. Host and forwarding headers are
  // spoofable, so `next dev` binds to 127.0.0.1 and this gate only allows
  // loopback Host without public forwarding headers.
  const gate = evaluateLocalDevAuth(request.headers);
  if (gate.kind === "allowed") {
    return NextResponse.next();
  }
  if (gate.kind === "blocked") {
    return new NextResponse(localDevAuthBlockedMessage(gate.reason), {
      status: 403,
    });
  }
  return NextResponse.next();
}

export default async function proxy(request: NextRequest) {
  // This route renders only public fixtures, never an authenticated organization.
  if (
    request.nextUrl.pathname === "/demo" ||
    request.nextUrl.pathname.startsWith("/demo/")
  ) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new NextResponse("This demo is read only.", { status: 405 });
    }
    const demoHeaders = new Headers(request.headers);
    demoHeaders.set("x-notra-public-demo", "1");
    return NextResponse.next({ request: { headers: demoHeaders } });
  }
  if (
    process.env.NODE_ENV === "production" &&
    /^\/design-system(?:\/|$)/.test(request.nextUrl.pathname)
  ) {
    return new NextResponse(null, { status: 404 });
  }

  request.headers.delete("x-notra-public-demo");

  // Local impersonation has no WorkOS session and still requires loopback.
  if (isLocalDevAuthEnabled()) {
    return localDevProxy(request);
  }

  const { session, headers } = await authkit(request);
  const { pathname, search } = request.nextUrl;

  if (!session.user && !NON_DASHBOARD_PATH.test(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", `${pathname}${search}`);
    return handleAuthkitProxy(request, headers, { redirect: loginUrl });
  }

  return handleAuthkitProxy(request, headers);
}

// Machine-to-machine routes authenticate themselves (signatures, CRON_SECRET,
// bearer tokens) and never read the AuthKit session, so running the proxy there
// only adds an invocation per webhook, ingest event, cron and workflow callback.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|badges(?:/|$)|favicon.ico|apple-icon.png|icon0.svg|icon1.png|robots.txt|design\\.md(?:/|$)|api/webhooks/|api/geo/ingest(?:/|$)|api/cron/|api/healthcheck(?:/|$)|api/workflows/|api/internal/|\\.well-known/workflow/|ingest/).*)",
  ],
};
