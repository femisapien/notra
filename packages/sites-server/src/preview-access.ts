import { db } from "@notra/db/drizzle";
import { sites } from "@notra/db/schema";
import {
  SITE_PREVIEW_AUTH_PATH,
  SITE_PREVIEW_PASSWORD_MAX_LENGTH,
  SITE_PREVIEW_PASSWORD_MIN_LENGTH,
  SITE_PREVIEW_MEMBER_SESSION_SECONDS,
  SITE_PREVIEW_SHARE_LINK_SECONDS,
} from "@notra/sites-core/constants/sites";
import { hashPreviewPassword } from "@notra/sites-core/utils/preview-password";
import { safePreviewNextPath } from "@notra/sites-core/utils/preview-path";
import { signSitePreviewToken } from "@notra/sites-core/utils/preview-token";
import { eq } from "drizzle-orm";

import { getSitesPreviewSecret } from "./env";
import { SiteInputError } from "./sites";
import { syncServingPreviewAccess } from "./state";
import type {
  PreviewAccessUrl,
  PreviewAccessUrlParams,
} from "./types/preview-access";
import type { ServingSiteRef } from "./types/state";
import { sitePreviewOrigin } from "./urls";

/**
 * URL that signs a member into a protected preview: the worker verifies the
 * token, sets an HttpOnly cookie for that preview host and redirects to `next`.
 */
export async function previewAccessUrl(
  params: PreviewAccessUrlParams
): Promise<PreviewAccessUrl> {
  const lifetime =
    params.kind === "share"
      ? SITE_PREVIEW_SHARE_LINK_SECONDS
      : SITE_PREVIEW_MEMBER_SESSION_SECONDS;
  const issuedAt = Date.now();
  const exp = Math.floor(issuedAt / 1000) + lifetime;
  const token = await signSitePreviewToken(
    {
      siteId: params.site.id,
      previewKey: params.previewKey,
      exp,
      kind: params.kind,
      // Lets the worker end the session when this member signs out or loses access.
      userId: params.userId,
      issuedAt,
    },
    getSitesPreviewSecret()
  );
  const next = safePreviewNextPath(params.next);
  const url = new URL(
    SITE_PREVIEW_AUTH_PATH,
    sitePreviewOrigin(params.site.slug, params.previewKey)
  );
  url.searchParams.set("token", token);
  url.searchParams.set("next", next);
  return { url: url.toString(), expiresAt: new Date(exp * 1000) };
}

/**
 * Sets (or with `null` removes) the password that opens the site's protected
 * previews next to Notra login. Only a salted PBKDF2 hash reaches the serving
 * state the worker reads; every change ends the existing password sessions.
 */
export async function setSitePreviewPassword(
  site: ServingSiteRef,
  password: string | null
): Promise<void> {
  if (
    password !== null &&
    (password.length < SITE_PREVIEW_PASSWORD_MIN_LENGTH ||
      password.length > SITE_PREVIEW_PASSWORD_MAX_LENGTH)
  ) {
    throw new SiteInputError(
      `The password needs ${SITE_PREVIEW_PASSWORD_MIN_LENGTH} to ${SITE_PREVIEW_PASSWORD_MAX_LENGTH} characters`
    );
  }
  // The database is the source of truth; state.json only mirrors the hash for the worker.
  await db
    .update(sites)
    .set({
      previewPassword:
        password === null ? null : await hashPreviewPassword(password),
    })
    .where(eq(sites.id, site.id));
  await syncServingPreviewAccess(site);
}
