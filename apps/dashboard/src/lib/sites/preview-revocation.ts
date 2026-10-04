import { isSitesConfigured } from "@notra/sites-server/env";
import {
  revokeOrganizationMemberPreviewAccess,
  revokeUserPreviewSessions,
} from "@notra/sites-server/preview-revocation";

/**
 * Ends a member's access to the organization's protected previews right away
 * (their sessions and the share links they created). Never throws: losing
 * this only leaves the short member session (1 h) as the upper bound.
 */
export async function revokeSitePreviewAccess(
  organizationId: string,
  userId: string
): Promise<void> {
  if (!isSitesConfigured()) {
    return;
  }
  try {
    await revokeOrganizationMemberPreviewAccess(organizationId, userId);
  } catch (error) {
    console.error("sites.preview_revoke_failed", {
      organizationId,
      userId,
      error: error instanceof Error ? error.message : error,
    });
  }
}

/** Dashboard sign-out also signs the user out of every preview. Never throws. */
export async function revokeSitePreviewSessions(userId: string): Promise<void> {
  if (!isSitesConfigured()) {
    return;
  }
  try {
    await revokeUserPreviewSessions(userId);
  } catch (error) {
    console.error("sites.preview_sign_out_failed", {
      userId,
      error: error instanceof Error ? error.message : error,
    });
  }
}
