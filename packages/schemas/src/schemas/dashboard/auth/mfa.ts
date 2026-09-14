import "zod/compile";
import { returnToSchema } from "@notra/schemas/dashboard/auth/return-to";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

const AUTH_TOKEN_MAX_LENGTH = 4096;
const WORKOS_ID_MAX_LENGTH = 128;
const ONE_TIME_CODE_REGEX = /^\d{6}$/;

export const totpCodeSchema = z
  .string()
  .regex(
    ONE_TIME_CODE_REGEX,
    "Enter the 6-digit code from your authenticator app"
  );

const workosIdSchema = (label: string) =>
  z.string().min(1, `${label} is missing`).max(WORKOS_ID_MAX_LENGTH);

const FACTOR_NAME_MAX_LENGTH = 40;

/** Optional user-given label for an authenticator; blank means "no name". */
export const factorNameSchema = z
  .string()
  .trim()
  .max(FACTOR_NAME_MAX_LENGTH, "Name must be at most 40 characters")
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

export const verifyMfaCodeInputSchema = z.object({
  pendingAuthenticationToken: z
    .string()
    .min(1, "Sign-in session is missing")
    .max(AUTH_TOKEN_MAX_LENGTH),
  authenticationChallengeId: workosIdSchema("Challenge"),
  code: totpCodeSchema,
  returnTo: returnToSchema,
  factorLabel: z
    .object({ factorId: workosIdSchema("Factor"), name: factorNameSchema })
    .optional(),
});

const BACKUP_CODE_SEPARATOR_REGEX = /[\s-]/g;
const BACKUP_CODE_REGEX = /^[a-z0-9]{8}$/;

export const backupCodeSchema = z
  .string()
  .transform((value) =>
    value.toLowerCase().replace(BACKUP_CODE_SEPARATOR_REGEX, "")
  )
  .pipe(z.string().regex(BACKUP_CODE_REGEX, "Enter a valid backup code"));

export const redeemBackupCodeInputSchema = z.object({
  code: backupCodeSchema,
  returnTo: returnToSchema,
});

export const verifyTotpEnrollmentInputSchema = z.object({
  authenticationChallengeId: workosIdSchema("Challenge"),
  code: totpCodeSchema,
  name: factorNameSchema,
});

export const removeAuthFactorInputSchema = z.object({
  factorId: workosIdSchema("Factor"),
});
