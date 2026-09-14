"use server";

import { db } from "@notra/db/drizzle";
import { users } from "@notra/db/schema";
import { POSTHOG_EVENTS } from "@notra/posthog/events";
import {
  redeemBackupCodeInputSchema,
  verifyMfaCodeInputSchema,
} from "@notra/schemas/dashboard/auth/mfa";
import type {
  AuthFlowResult,
  RedeemBackupCodeInput,
  RedeemBackupCodeResult,
  VerifyMfaCodeInput,
} from "@notra/schemas/types/dashboard/auth";
import { getWorkOS } from "@workos-inc/authkit-nextjs";
import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { ANALYTICS_AUTH_METHODS } from "@/constants/analytics-events";
import { MFA_RECOVERY_COOKIE, TOTP_FACTOR_TYPE } from "@/constants/security";
import {
  completeAuthentication,
  getWorkOSClientId,
  runAuthFlow,
  signedIn,
  trackAuthEvent,
  tryWorkOSAuth,
} from "@/lib/auth/auth-flow";
import {
  clearBackupCodes,
  hasBackupCodes,
  hasUnusedBackupCode,
  replaceBackupCodes,
} from "@/lib/auth/backup-codes";
import { UserSyncError } from "@/lib/auth/errors";
import { clearFactorLabels, setFactorLabel } from "@/lib/auth/factor-labels";
import { authenticateResolvingOrgSelection } from "@/lib/auth/org-selection";
import {
  clearShortLivedCookie,
  readShortLivedCookie,
} from "@/lib/auth/short-lived-cookie";
import { readWorkOSError } from "@/lib/auth/workos-error";
import { isRateLimited, ratelimit } from "@/utils/ratelimit";

const RATE_LIMITED_MESSAGE = "Too many attempts. Please try again shortly.";
const BACKUP_CODE_REJECTED_MESSAGE =
  "That backup code isn't valid or was already used.";

export async function verifyMfaCodeAction(
  rawInput: VerifyMfaCodeInput
): Promise<AuthFlowResult> {
  const parsed = verifyMfaCodeInputSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid code",
    };
  }

  if (
    await isRateLimited(
      ratelimit.mfaVerify,
      parsed.data.authenticationChallengeId
    )
  ) {
    return { status: "error", message: RATE_LIMITED_MESSAGE };
  }

  return runAuthFlow(
    "",
    Effect.gen(function* () {
      const response = yield* authenticateResolvingOrgSelection(() =>
        getWorkOS().userManagement.authenticateWithTotp({
          clientId: getWorkOSClientId(),
          code: parsed.data.code,
          pendingAuthenticationToken: parsed.data.pendingAuthenticationToken,
          authenticationChallengeId: parsed.data.authenticationChallengeId,
        })
      );

      const session = yield* completeAuthentication(
        response,
        parsed.data.returnTo,
        POSTHOG_EVENTS.MFA_VERIFIED
      );

      const factorId = parsed.data.factorLabel?.factorId;
      const factorName = parsed.data.factorLabel?.name;
      if (factorId && factorName) {
        const factors = yield* tryWorkOSAuth(() =>
          getWorkOS().multiFactorAuth.listUserAuthFactors({
            userId: response.user.id,
          })
        );
        if (factors.data.some((factor) => factor.id === factorId)) {
          yield* Effect.promise(() =>
            setFactorLabel(session.localUserId, factorId, factorName)
          );
        }
      }

      const alreadyHasCodes = yield* Effect.promise(() =>
        hasBackupCodes(session.localUserId)
      );
      if (alreadyHasCodes) {
        return signedIn(session);
      }

      const backupCodes = yield* Effect.tryPromise({
        try: () => replaceBackupCodes(session.localUserId),
        catch: (cause) =>
          new UserSyncError({
            message: "Failed to generate backup codes",
            cause,
          }),
      });
      return {
        status: "enrolled" as const,
        redirectTo: session.redirectTo,
        backupCodes,
      };
    })
  );
}

export async function redeemBackupCodeAction(
  rawInput: RedeemBackupCodeInput
): Promise<RedeemBackupCodeResult> {
  const parsed = redeemBackupCodeInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid backup code",
    };
  }

  const workosUserId = await readShortLivedCookie(MFA_RECOVERY_COOKIE);
  if (!workosUserId) {
    return {
      status: "error",
      message: "This sign-in attempt expired. Please start again.",
    };
  }

  if (await isRateLimited(ratelimit.backupCode, workosUserId)) {
    return { status: "error", message: RATE_LIMITED_MESSAGE };
  }

  const rejected: RedeemBackupCodeResult = {
    status: "error",
    message: BACKUP_CODE_REJECTED_MESSAGE,
  };

  return Effect.runPromise(
    Effect.gen(function* () {
      const localUser = yield* Effect.promise(() =>
        db.query.users.findFirst({
          where: eq(users.workosUserId, workosUserId),
          columns: { id: true, email: true },
        })
      );
      if (!localUser) {
        return rejected;
      }

      const matches = yield* Effect.promise(() =>
        hasUnusedBackupCode(localUser.id, parsed.data.code)
      );
      if (!matches) {
        return rejected;
      }

      const factors = yield* tryWorkOSAuth(() =>
        getWorkOS().multiFactorAuth.listUserAuthFactors({
          userId: workosUserId,
        })
      );
      yield* Effect.forEach(
        factors.data.filter((factor) => factor.type === TOTP_FACTOR_TYPE),
        (factor) =>
          tryWorkOSAuth(() =>
            getWorkOS().multiFactorAuth.deleteFactor(factor.id)
          ),
        { discard: true }
      );

      yield* Effect.promise(() => clearBackupCodes(localUser.id));
      yield* Effect.promise(() => clearFactorLabels(localUser.id));
      yield* Effect.promise(() => clearShortLivedCookie(MFA_RECOVERY_COOKIE));
      yield* Effect.promise(() =>
        trackAuthEvent(
          POSTHOG_EVENTS.MFA_BACKUP_CODE_USED,
          { method: ANALYTICS_AUTH_METHODS.PASSWORD },
          localUser.id
        )
      );
      return {
        status: "recovered" as const,
        email: localUser.email,
      };
    }).pipe(
      Effect.catch((error) =>
        Effect.succeed<RedeemBackupCodeResult>({
          status: "error",
          message: readWorkOSError(error.error).message,
        })
      )
    )
  );
}
