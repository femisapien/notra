export interface DevAccount {
  email: string;
  password: string;
  totpSecret: string | null;
  totpEnrolledAt: string | null;
  totpName: string | null;
}

export interface DevSession {
  email: string;
  secondFactor: "totp" | null;
  signedInAt: string;
}

export interface DevPendingAuth {
  token: string;
  challengeId: string;
  kind: "mfa" | "enrollment";
  enrollmentSecret: string | null;
}

export interface DevLogEntry {
  id: string;
  at: string;
  message: string;
}

export interface DevSettingsEnrollment {
  secret: string;
  qrCode: string;
  otpauthUri: string;
}

export type AuthFlowTab = "sign-in" | "settings";
