import {
  SITE_PREVIEW_COOKIE,
  SITE_PREVIEW_MEMBER_RENEW_SECONDS,
  SITE_PREVIEW_PASSWORD_MAX_LENGTH,
  SITE_PREVIEW_SESSION_SECONDS,
} from "@notra/sites-core/constants/sites";
import type { SiteServingState } from "@notra/sites-core/types/deployment";
import type { SitePreviewTokenClaims } from "@notra/sites-core/types/preview-token";
import { verifyPreviewPassword } from "@notra/sites-core/utils/preview-password";
import { safePreviewNextPath } from "@notra/sites-core/utils/preview-path";
import { isPreviewTokenRevoked } from "@notra/sites-core/utils/preview-revocation";
import {
  previewTokenAllows,
  readSitePreviewToken,
  signSitePreviewToken,
  verifySitePreviewToken,
} from "@notra/sites-core/utils/preview-token";

import {
  GATE_ERROR_PARAMS,
  PASSWORD_FORM_MAX_BYTES,
} from "./constants/preview-auth";
import { previewLockedPage } from "./pages";
import { html } from "./responses";
import type { PreviewGateError } from "./types/pages";
import type { PreviewRequestContext } from "./types/preview-auth";
import type { SitesDeps } from "./types/worker";
import { readCookie } from "./utils/cookies";

function nowSeconds(deps: SitesDeps): number {
  return Math.floor(deps.now().getTime() / 1000);
}

export function previewSignInUrl(
  deps: SitesDeps,
  siteId: string,
  previewKey: string,
  next: string
): string {
  const signIn = new URL("/sites/preview-access", deps.dashboardUrl);
  signIn.searchParams.set("site", siteId);
  signIn.searchParams.set("preview", previewKey);
  signIn.searchParams.set("next", next);
  return signIn.toString();
}

function previewGate(
  context: PreviewRequestContext,
  next: string,
  status: number,
  error: PreviewGateError | null = null
): Response {
  const { deps, state, siteId, previewKey } = context;
  return html(
    previewLockedPage({
      signInUrl: previewSignInUrl(deps, siteId, previewKey, next),
      passwordEnabled: state.previewPassword !== null,
      next,
      error,
    }),
    status
  );
}

/** Host-only cookie for this preview host. `Secure` everywhere except plain-http local dev. */
function sessionCookie(url: URL, value: string, maxAge: number): string {
  const secure = url.protocol === "https:" ? "; Secure" : "";
  return `${SITE_PREVIEW_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly${secure}; SameSite=Lax`;
}

/**
 * A session opens this preview when it is signed for it, its member was not
 * revoked since it was issued (sign-out, removed from the organization) and,
 * for password sessions, it was opened with the password that is set right
 * now. Changing or removing the password ends every password session at once.
 */
export function previewSessionAllows(
  claims: SitePreviewTokenClaims,
  state: SiteServingState,
  siteId: string,
  previewKey: string
): boolean {
  if (
    !previewTokenAllows(claims, siteId, previewKey) ||
    isPreviewTokenRevoked(claims, state.revokedSessions)
  ) {
    return false;
  }
  if (claims.kind !== "password") {
    return true;
  }
  return (
    state.previewPassword !== null &&
    claims.passwordVersion === state.previewPassword.version
  );
}

/** `GET /_notra/auth?token=…`: a member or share-link token from the dashboard becomes the session cookie. */
async function acceptToken(
  context: PreviewRequestContext,
  next: string
): Promise<Response> {
  const { deps, url, state, siteId, previewKey } = context;
  const errorParam = url.searchParams.get("error");
  const token = url.searchParams.get("token");
  if (!token) {
    const error =
      errorParam && errorParam in GATE_ERROR_PARAMS
        ? GATE_ERROR_PARAMS[errorParam as keyof typeof GATE_ERROR_PARAMS]
        : null;
    const gate = previewGate(context, next, error ? 403 : 401, error);
    // The dashboard said no: drop the old session so it is not renewed again (no redirect loop).
    if (error) {
      gate.headers.set("Set-Cookie", sessionCookie(url, "", 0));
    }
    return gate;
  }
  const claims = await verifySitePreviewToken(
    token,
    deps.previewSecret,
    nowSeconds(deps)
  );
  // Password sessions are minted here only; one in a URL is never accepted.
  if (
    !claims ||
    claims.kind === "password" ||
    !previewSessionAllows(claims, state, siteId, previewKey)
  ) {
    return previewGate(context, next, 401, "invalid_link");
  }
  // Member cookies outlive their 1 h token so an expired one can be renewed without a click.
  const maxAge =
    claims.kind === "member"
      ? SITE_PREVIEW_MEMBER_RENEW_SECONDS
      : Math.min(
          SITE_PREVIEW_SESSION_SECONDS,
          Math.max(0, claims.exp - nowSeconds(deps))
        );
  return new Response(null, {
    status: 302,
    headers: {
      Location: next,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "Set-Cookie": sessionCookie(url, token, maxAge),
    },
  });
}

async function readPasswordForm(
  request: Request
): Promise<{ password: string; next: string } | null> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > PASSWORD_FORM_MAX_BYTES) {
    return null;
  }
  const body = await request.text();
  if (body.length > PASSWORD_FORM_MAX_BYTES) {
    return null;
  }
  const form = new URLSearchParams(body);
  return {
    password: form.get("password") ?? "",
    next: safePreviewNextPath(form.get("next")),
  };
}

function isPageNavigation(request: Request): boolean {
  return (
    request.method === "GET" &&
    (request.headers.get("Sec-Fetch-Mode") === "navigate" ||
      (request.headers.get("Accept") ?? "").includes("text/html"))
  );
}

/** Requests from another origin never reach the password check (login CSRF, scripted guessing from other sites). */
function isCrossOrigin(request: Request, origin: string): boolean {
  const requestOrigin = request.headers.get("Origin");
  return requestOrigin !== null && requestOrigin !== origin;
}

/** `POST /_notra/auth`: the preview password opens a session like a Notra login does. */
async function acceptPassword(
  context: PreviewRequestContext
): Promise<Response> {
  const { deps, request, url, origin, state, siteId, previewKey } = context;
  const form = await readPasswordForm(request);
  if (!form) {
    return new Response("Request too large", { status: 413 });
  }
  const { password, next } = form;
  const stored = state.previewPassword;
  if (!stored || isCrossOrigin(request, origin)) {
    return previewGate(context, next, 403);
  }
  if (deps.passwordAttemptLimiter) {
    const client = request.headers.get("CF-Connecting-IP") ?? "unknown";
    const { success } = await deps.passwordAttemptLimiter.limit({
      key: `${siteId}:${previewKey}:${client}`,
    });
    if (!success) {
      return previewGate(context, next, 429, "too_many_attempts");
    }
  }
  const valid =
    password.length <= SITE_PREVIEW_PASSWORD_MAX_LENGTH &&
    (await verifyPreviewPassword(password, stored));
  if (!valid) {
    return previewGate(context, next, 401, "wrong_password");
  }
  const exp = nowSeconds(deps) + SITE_PREVIEW_SESSION_SECONDS;
  const token = await signSitePreviewToken(
    {
      siteId,
      previewKey,
      exp,
      kind: "password",
      passwordVersion: stored.version,
    },
    deps.previewSecret
  );
  return new Response(null, {
    status: 303,
    headers: {
      Location: next,
      "Cache-Control": "no-store",
      "Set-Cookie": sessionCookie(url, token, SITE_PREVIEW_SESSION_SECONDS),
    },
  });
}

export async function handlePreviewAuth(
  context: PreviewRequestContext
): Promise<Response> {
  if (context.request.method === "POST") {
    return await acceptPassword(context);
  }
  return await acceptToken(
    context,
    safePreviewNextPath(context.url.searchParams.get("next"))
  );
}

/** Clears this host's preview session and shows the gate again. */
export function handlePreviewSignOut(context: PreviewRequestContext): Response {
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/",
      "Cache-Control": "no-store",
      "Set-Cookie": sessionCookie(context.url, "", 0),
    },
  });
}

/** Protected previews need a valid session cookie for exactly this site and preview. */
export async function previewAccessDenied(
  context: PreviewRequestContext
): Promise<Response | null> {
  const { deps, request, url, state, siteId, previewKey } = context;
  const cookie = readCookie(request, SITE_PREVIEW_COOKIE);
  const session = cookie
    ? await readSitePreviewToken(cookie, deps.previewSecret, nowSeconds(deps))
    : null;
  const allowed =
    session !== null &&
    previewSessionAllows(session.claims, state, siteId, previewKey);
  const next = `${url.pathname}${url.search}`;
  if (allowed && !session.expired) {
    return null;
  }
  // An expired member session that was never revoked: the dashboard re-checks
  // membership and sends the member straight back, no gate, no click.
  if (
    allowed &&
    session.claims.kind === "member" &&
    isPageNavigation(request)
  ) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: previewSignInUrl(deps, siteId, previewKey, next),
        "Cache-Control": "no-store",
      },
    });
  }
  return previewGate(context, next, 401);
}
