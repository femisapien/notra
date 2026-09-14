"use server";

import { POSTHOG_EVENTS, type PostHogEventName } from "@notra/posthog/events";
import {
  removeAuthFactorInputSchema,
  verifyTotpEnrollmentInputSchema,
} from "@notra/schemas/dashboard/auth/mfa";
import type {
  RegenerateBackupCodesResult,
  RemoveAuthFactorInput,
  SecurityOverview,
  StartTotpEnrollmentResult,
  TotpFactorSummary,
  VerifyTotpEnrollmentInput,
  VerifyTotpEnrollmentResult,
} from "@notra/schemas/types/dashboard/auth";
import type { Ratelimit } from "@upstash/ratelimit";
import { getWorkOS } from "@workos-inc/authkit-nextjs";
import { Effect } from "effect";

import { SECURITY_ERROR_CODES, TOTP_FACTOR_TYPE } from "@/constants/security";
import { ActionFailure } from "@/lib/actions/errors";
import { runAction } from "@/lib/actions/run-action";
import { validateActionInput } from "@/lib/actions/validate-input";
import { trackServerEvent } from "@/lib/analytics/posthog-server";
import { readRequestHeaders } from "@/lib/analytics/request-headers";
import {
  clearBackupCodes,
  countRemainingBackupCodes,
  replaceBackupCodes,
} from "@/lib/auth/backup-codes";
import {
  deleteFactorLabel,
  listFactorLabels,
  setFactorLabel,
} from "@/lib/auth/factor-labels";
import { readWorkOSError } from "@/lib/auth/workos-error";
import { createTotpFactor } from "@/lib/auth/workos-mfa";
import { requireSession } from "@/lib/organizations/guards";
import type { ActionResult } from "@/types/organizations/actions";
import { isRateLimited, ratelimit } from "@/utils/ratelimit";

const RATE_LIMITED_MESSAGE = "Too many attempts. Please try again shortly.";
const INVALID_TOTP_MESSAGE =
  "That code didn't work. Check your authenticator app and try again.";

const tryWorkOS = <T>(run: () => Promise<T>) =>
  Effect.tryPromise({
    try: run,
    catch: (cause) =>
      new ActionFailure({ message: readWorkOSError(cause).message, cause }),
  });

const tryDb = <T>(run: () => Promise<T>, message: string) =>
  Effect.tryPromise({
    try: run,
    catch: (cause) => new ActionFailure({ message, cause }),
  });

const enforceRateLimit = (limiter: Ratelimit, key: string) =>
  Effect.promise(() => isRateLimited(limiter, key)).pipe(
    Effect.andThen((limited) =>
      limited
        ? Effect.fail(new ActionFailure({ message: RATE_LIMITED_MESSAGE }))
        : Effect.void
    )
  );

const requireSecurityContext = Effect.fn("auth.security.requireContext")(
  function* () {
    const session = yield* requireSession();
    const workosUserId = session.user.workosUserId;
    if (!workosUserId) {
      return yield* Effect.fail(
        new ActionFailure({
          code: SECURITY_ERROR_CODES.UNAVAILABLE,
          message: "Security settings aren't available for this account yet.",
        })
      );
    }

    return {
      localUserId: session.user.id,
      email: session.user.email,
      workosUserId,
    };
  }
);

const trackSecurityEvent = (event: PostHogEventName, userId: string) =>
  Effect.promise(async () => {
    const requestHeaders = await readRequestHeaders();
    trackServerEvent({ event, headers: requestHeaders, userId });
  });

const listTotpFactors = Effect.fn("auth.security.listTotpFactors")(function* (
  workosUserId: string,
  localUserId: string
) {
  const [factors, labels] = yield* Effect.all(
    [
      tryWorkOS(() =>
        getWorkOS().multiFactorAuth.listUserAuthFactors({
          userId: workosUserId,
        })
      ),
      tryDb(() => listFactorLabels(localUserId), "Failed to load factor names"),
    ],
    { concurrency: "unbounded" }
  );
  return factors.data
    .filter((factor) => factor.type === TOTP_FACTOR_TYPE)
    .map<TotpFactorSummary>((factor) => ({
      id: factor.id,
      name: labels.get(factor.id) ?? null,
      issuer: factor.totp?.issuer ?? null,
      createdAt: factor.createdAt,
    }));
});

export async function getSecurityOverviewAction(): Promise<
  ActionResult<SecurityOverview>
> {
  return runAction(
    Effect.gen(function* () {
      const context = yield* requireSecurityContext();

      const totpFactors = yield* listTotpFactors(
        context.workosUserId,
        context.localUserId
      );
      const backupCodesRemaining =
        totpFactors.length > 0
          ? yield* Effect.promise(() =>
              countRemainingBackupCodes(context.localUserId)
            )
          : 0;

      return {
        email: context.email,
        totpFactors,
        backupCodesRemaining,
      };
    })
  );
}

export async function startTotpEnrollmentAction(): Promise<
  ActionResult<StartTotpEnrollmentResult>
> {
  return runAction(
    Effect.gen(function* () {
      const context = yield* requireSecurityContext();
      return yield* tryWorkOS(() =>
        createTotpFactor(context.workosUserId, context.email)
      );
    })
  );
}

export async function verifyTotpEnrollmentAction(
  rawInput: VerifyTotpEnrollmentInput
): Promise<ActionResult<VerifyTotpEnrollmentResult>> {
  return runAction(
    Effect.gen(function* () {
      const context = yield* requireSecurityContext();
      const input = yield* validateActionInput(
        verifyTotpEnrollmentInputSchema,
        rawInput
      );
      yield* enforceRateLimit(
        ratelimit.mfaVerify,
        input.authenticationChallengeId
      );

      const verification = yield* tryWorkOS(() =>
        getWorkOS().multiFactorAuth.verifyChallenge({
          authenticationChallengeId: input.authenticationChallengeId,
          code: input.code,
        })
      );
      if (!verification.valid) {
        return yield* Effect.fail(
          new ActionFailure({
            code: SECURITY_ERROR_CODES.INVALID_CODE,
            message: INVALID_TOTP_MESSAGE,
          })
        );
      }

      if (input.name) {
        yield* tryDb(
          () =>
            setFactorLabel(
              context.localUserId,
              verification.challenge.authenticationFactorId,
              input.name ?? ""
            ),
          "Two-factor is on, but the name couldn't be saved."
        );
      }

      // The factor is live from here on. If issuing codes fails the user
      // still ends up with 2FA on and can regenerate from settings.
      const backupCodes = yield* tryDb(
        () => replaceBackupCodes(context.localUserId),
        "Two-factor is on, but backup codes couldn't be generated. Regenerate them from settings."
      );
      yield* trackSecurityEvent(
        POSTHOG_EVENTS.MFA_FACTOR_ENROLLED,
        context.localUserId
      );
      return { verified: true as const, backupCodes };
    })
  );
}

export async function regenerateBackupCodesAction(): Promise<
  ActionResult<RegenerateBackupCodesResult>
> {
  return runAction(
    Effect.gen(function* () {
      const context = yield* requireSecurityContext();
      const factors = yield* listTotpFactors(
        context.workosUserId,
        context.localUserId
      );
      if (factors.length === 0) {
        return yield* Effect.fail(
          new ActionFailure({
            message:
              "Set up an authenticator app before generating backup codes.",
          })
        );
      }
      const codes = yield* tryDb(
        () => replaceBackupCodes(context.localUserId),
        "Couldn't generate backup codes. Please try again."
      );
      yield* trackSecurityEvent(
        POSTHOG_EVENTS.MFA_BACKUP_CODES_REGENERATED,
        context.localUserId
      );
      return { codes };
    })
  );
}

export async function removeAuthFactorAction(
  rawInput: RemoveAuthFactorInput
): Promise<ActionResult<{ removed: true }>> {
  return runAction(
    Effect.gen(function* () {
      const context = yield* requireSecurityContext();
      const input = yield* validateActionInput(
        removeAuthFactorInputSchema,
        rawInput
      );

      const factors = yield* listTotpFactors(
        context.workosUserId,
        context.localUserId
      );
      if (!factors.some((factor) => factor.id === input.factorId)) {
        return yield* Effect.fail(
          new ActionFailure({
            message: "That authentication method no longer exists.",
          })
        );
      }

      yield* tryWorkOS(() =>
        getWorkOS().multiFactorAuth.deleteFactor(input.factorId)
      );
      yield* Effect.promise(() => deleteFactorLabel(input.factorId));
      if (factors.length === 1) {
        yield* Effect.promise(() => clearBackupCodes(context.localUserId));
      }
      yield* trackSecurityEvent(
        POSTHOG_EVENTS.MFA_FACTOR_REMOVED,
        context.localUserId
      );
      return { removed: true as const };
    })
  );
}
