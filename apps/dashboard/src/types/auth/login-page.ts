export interface LoginPendingParams {
  verify?: string;
  mfaToken?: string;
  mfaChallengeId?: string;
  email?: string;
}

export interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}
