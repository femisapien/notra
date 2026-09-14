import type { TotpFactorSummary } from "@notra/ui/lib/security-types";

export interface SecurityOverview {
  email: string;
  totpFactors: TotpFactorSummary[];
  backupCodesRemaining: number;
}

export interface StartTotpEnrollmentResult {
  factorId: string;
  authenticationChallengeId: string;
  qrCode: string;
  secret: string;
  otpauthUri: string;
}

export interface VerifyTotpEnrollmentResult {
  verified: true;
  backupCodes: string[];
}

export interface RegenerateBackupCodesResult {
  codes: string[];
}

export interface VerifyTotpEnrollmentInput {
  authenticationChallengeId: string;
  code: string;
}

export interface RemoveAuthFactorInput {
  factorId: string;
}
