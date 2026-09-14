export const TOTP_ISSUER = "Notra";
export const TOTP_FACTOR_TYPE = "totp";

/** Identifies the user mid-challenge so a backup code can be redeemed. */
export const MFA_RECOVERY_COOKIE = "notra_mfa_recovery";
export const MFA_RECOVERY_COOKIE_MAX_AGE_SECONDS = 10 * 60;

export const MFA_ERROR_CODES = {
  CHALLENGE: "mfa_challenge",
  ENROLLMENT: "mfa_enrollment",
} as const;

export const SECURITY_ERROR_CODES = {
  INVALID_CODE: "invalid_code",
  UNAVAILABLE: "unavailable",
} as const;

export const LOGIN_MFA_QUERY_KEYS = {
  token: "mfa",
  challenge: "challenge",
} as const;

export const BACKUP_CODE_COUNT = 10;
export const BACKUP_CODE_LENGTH = 8;
/** Lowercase, no ambiguous characters (0/o, 1/l/i). */
export const BACKUP_CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export const LOGIN_ERROR_KEYS = {
  MFA_ENROLLMENT_REQUIRED: "mfa-enrollment-required",
} as const;
