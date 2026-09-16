/** Server-side record of the sign-in attempt that is currently mid-MFA. */
export interface MfaAttempt {
  workosUserId: string;
  authenticationChallengeId: string;
  /** Unix ms; recovery only removes factors that existed when it started. */
  startedAt: number;
}

/** A challenge handed from the social callback to /login. */
export interface PendingMfaChallenge {
  kind: "challenge";
  pendingAuthenticationToken: string;
  authenticationChallengeId: string;
  email: string;
}

/**
 * A required enrollment handed from the social callback to /login. The
 * factor is created once the page loads, since its QR code is too large
 * for a cookie.
 */
export interface PendingMfaEnrollment {
  kind: "enrollment";
  pendingAuthenticationToken: string;
  workosUserId: string;
  email: string;
}

export type PendingMfaFlow = PendingMfaChallenge | PendingMfaEnrollment;

/** The settings enrollment that this browser started, bound to its account. */
export interface TotpEnrollmentInProgress {
  localUserId: string;
  factorId: string;
  authenticationChallengeId: string;
}
