/** Why the gate page is shown again; each maps to one message. */
export type PreviewGateError =
  | "wrong_password"
  | "too_many_attempts"
  | "forbidden"
  | "invalid_link";

export interface PreviewGatePage {
  /** Dashboard URL that signs Notra members in. */
  signInUrl: string;
  /** Shows the password form when the site has a preview password. */
  passwordEnabled: boolean;
  /** Path to return to after signing in. */
  next: string;
  error: PreviewGateError | null;
}

export interface SystemPageContent {
  title: string;
  /** Raw HTML, already escaped. */
  body: string;
}
