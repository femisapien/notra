import type { PendingAuthStep } from "@notra/schemas/types/dashboard/auth";

export interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Where the login page opens: on a pending step, or on the handoff that
 * finishes a social sign-in's required enrollment.
 */
export interface LoginPageStart {
  pending?: PendingAuthStep;
  resumeEnrollmentFlowId?: string;
}

export interface SocialEnrollmentResumeProps {
  flowId: string;
  returnTo?: string;
}
