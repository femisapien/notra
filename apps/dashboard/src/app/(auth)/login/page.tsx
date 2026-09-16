import type { PendingAuthStep } from "@notra/schemas/types/dashboard/auth";

import { LoginErrorTracker } from "@/components/auth/login-error-tracker";
import { LoginForm } from "@/components/auth/login-form";
import { SocialEnrollmentResume } from "@/components/auth/social-enrollment-resume";
import { LOGIN_MFA_QUERY_KEY } from "@/constants/security";
import { readPendingMfaFlow } from "@/lib/auth/mfa-cookies";
import type { LoginPageProps, LoginPageStart } from "@/types/auth/login-page";

const ERROR_MESSAGES: Record<string, string> = {
  "social-sign-in-failed": "Social sign-in failed. Please try again.",
  "external-login-failed":
    "Authorization could not be completed. Please try again.",
};

/** Which screen the page opens on, from the social handoff or the URL. */
async function resolveStart(
  mfa: string | undefined,
  verify: string | undefined,
  email: string | undefined
): Promise<LoginPageStart> {
  if (mfa) {
    const flow = await readPendingMfaFlow(mfa);
    if (flow?.kind === "challenge") {
      const { kind: _kind, ...challenge } = flow;
      return { pending: { status: "mfa-required", ...challenge } };
    }
    if (flow?.kind === "enrollment") {
      return { resumeEnrollmentFlowId: mfa };
    }
  }
  if (verify) {
    const pending: PendingAuthStep = {
      status: "verification-required",
      pendingAuthenticationToken: verify,
      email: email ?? "",
    };
    return { pending };
  }
  return {};
}

export default async function Login({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;

  const readParam = (key: string) => {
    const value = resolvedSearchParams[key];
    return typeof value === "string" ? value : undefined;
  };

  const returnTo = readParam("returnTo");
  const verify = readParam("verify");
  const email = readParam("email");
  const errorKey = readParam("error");
  const mfa = readParam(LOGIN_MFA_QUERY_KEY);
  const knownErrorKey =
    errorKey && errorKey in ERROR_MESSAGES ? errorKey : undefined;
  const start = await resolveStart(mfa, verify, email);

  return (
    <div className="mx-auto w-full max-w-md rounded-md p-6 lg:px-8 lg:py-10">
      {knownErrorKey ? <LoginErrorTracker errorCode={knownErrorKey} /> : null}
      {start.resumeEnrollmentFlowId ? (
        <SocialEnrollmentResume
          flowId={start.resumeEnrollmentFlowId}
          returnTo={returnTo}
        />
      ) : (
        <LoginForm
          initialError={errorKey ? ERROR_MESSAGES[errorKey] : undefined}
          initialPending={start.pending}
          returnTo={returnTo}
        />
      )}
    </div>
  );
}
