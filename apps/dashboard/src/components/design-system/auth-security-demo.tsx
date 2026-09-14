"use client";

import { MfaChallengeForm } from "@notra/ui/components/shared/auth/mfa-challenge-form";
import { TotpEnrollmentPanel } from "@notra/ui/components/shared/auth/totp-enrollment-panel";
import { TwoFactorSettings } from "@notra/ui/components/shared/security/two-factor-settings";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import type {
  RedeemBackupCode,
  TotpEnrollmentSubmission,
  TotpVerifyResult,
  VerifyMfaCode,
} from "@notra/ui/lib/auth-types";
import type {
  TotpEnrollmentSecrets,
  TotpFactorSummary,
} from "@notra/ui/lib/security-types";
import { useState } from "react";

import { Button } from "@/components/button";
import { DesignSystemSectionHeader } from "@/components/design-system/design-system-section-header";
import { buildPlaceholderQrCode } from "@/utils/design-system-qr";

const DEMO_VALID_CODE = "123456";
const DEMO_LATENCY_MS = 600;
const DEMO_EMAIL = "jane@company.com";
const DEMO_SETUP_KEY = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";
const DEMO_BACKUP_CODES = [
  "rd8qnvjk",
  "sqz6jxmt",
  "mkf7wpq2",
  "zs72gdbn",
  "jhksw4dk",
  "e5d6egkb",
  "7q6wmhz2",
  "5uaazm2p",
  "m52jkfbd",
  "g4p97pxt",
];
const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const DEMO_QR_CODE = buildPlaceholderQrCode();
const DEMO_ENROLLMENT: TotpEnrollmentSecrets = {
  qrCode: DEMO_QR_CODE,
  secret: DEMO_SETUP_KEY,
  otpauthUri: `otpauth://totp/Notra:${DEMO_EMAIL}?secret=${DEMO_SETUP_KEY}&issuer=Notra`,
};

const INITIAL_FACTORS: TotpFactorSummary[] = [
  {
    id: "auth_factor_demo_1",
    name: "iPhone",
    issuer: "Notra",
    createdAt: "2026-08-14T09:12:00.000Z",
  },
];

function DemoHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground text-xs">
      {children} Use <code className="font-mono">{DEMO_VALID_CODE}</code> as the
      valid code.
    </p>
  );
}

function MfaChallengeDemo() {
  const [state, setState] = useState<"idle" | "verified">("idle");

  const verifyMfaCode: VerifyMfaCode = async ({ code }) => {
    await wait(DEMO_LATENCY_MS);
    if (code === DEMO_VALID_CODE) {
      return { status: "success", redirectTo: "#auth-mfa" };
    }
    return {
      status: "error",
      message: "That code didn't work. Please try again.",
    };
  };

  const redeemBackupCode: RedeemBackupCode = async ({ code }) => {
    await wait(DEMO_LATENCY_MS);
    if (DEMO_BACKUP_CODES.includes(code.toLowerCase().replaceAll("-", ""))) {
      return { status: "recovered" as const, email: DEMO_EMAIL };
    }
    return {
      status: "error" as const,
      message: "That backup code isn't valid or was already used.",
    };
  };

  if (state === "verified") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Badge variant="success">Verified</Badge>
        <p className="text-muted-foreground text-sm">
          The challenge resolved and the app would redirect now.
        </p>
        <Button onClick={() => setState("idle")} size="sm" variant="outline">
          Reset
        </Button>
      </div>
    );
  }

  return (
    <MfaChallengeForm
      onBack={() => setState("idle")}
      onRecovered={() => setState("verified")}
      onResult={(result) => {
        if (result.status === "success" || result.status === "enrolled") {
          setState("verified");
          return true;
        }
        return false;
      }}
      redeemBackupCode={redeemBackupCode}
      step={{
        status: "mfa-required",
        pendingAuthenticationToken: "pending_demo",
        authenticationChallengeId: "auth_challenge_demo",
        email: DEMO_EMAIL,
      }}
      verifyMfaCode={verifyMfaCode}
    />
  );
}

function EnrollmentPanelDemo() {
  const [done, setDone] = useState(false);

  async function handleSubmit({
    code,
  }: TotpEnrollmentSubmission): Promise<TotpVerifyResult> {
    await wait(DEMO_LATENCY_MS);
    if (code !== DEMO_VALID_CODE) {
      return { ok: false, message: "That code didn't work. Try again." };
    }
    return { ok: true, backupCodes: DEMO_BACKUP_CODES };
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Badge variant="success">Enrolled</Badge>
        <Button onClick={() => setDone(false)} size="sm" variant="outline">
          Reset
        </Button>
      </div>
    );
  }

  return (
    <TotpEnrollmentPanel
      accountLabel={DEMO_EMAIL}
      onCancel={() => setDone(false)}
      onDone={() => setDone(true)}
      onSubmit={handleSubmit}
      otpauthUri={DEMO_ENROLLMENT.otpauthUri}
      qrCode={DEMO_QR_CODE}
      secret={DEMO_SETUP_KEY}
    />
  );
}

function TwoFactorSettingsDemo() {
  const [factors, setFactors] = useState<TotpFactorSummary[]>(INITIAL_FACTORS);
  const [enrollment, setEnrollment] = useState<TotpEnrollmentSecrets | null>(
    null
  );
  const [isStarting, setIsStarting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function startEnrollment() {
    setIsStarting(true);
    await wait(DEMO_LATENCY_MS);
    setEnrollment(DEMO_ENROLLMENT);
    setIsStarting(false);
  }

  async function verifyEnrollment({
    code,
    name,
  }: TotpEnrollmentSubmission): Promise<TotpVerifyResult> {
    await wait(DEMO_LATENCY_MS);
    if (code !== DEMO_VALID_CODE) {
      return { ok: false, message: "That code didn't work. Try again." };
    }
    setFactors([
      {
        id: `auth_factor_demo_${Date.now()}`,
        name,
        issuer: "Notra",
        createdAt: new Date().toISOString(),
      },
    ]);
    return { ok: true, backupCodes: DEMO_BACKUP_CODES };
  }

  async function regenerateBackupCodes() {
    await wait(DEMO_LATENCY_MS);
    return { ok: true as const, codes: [...DEMO_BACKUP_CODES].reverse() };
  }

  async function removeFactor(factorId: string) {
    setRemovingId(factorId);
    await wait(DEMO_LATENCY_MS);
    setFactors((current) => current.filter((factor) => factor.id !== factorId));
    setRemovingId(null);
  }

  return (
    <TwoFactorSettings
      accountLabel={DEMO_EMAIL}
      backupCodesRemaining={factors.length ? DEMO_BACKUP_CODES.length : null}
      enrollment={enrollment}
      factors={factors}
      isStartingEnrollment={isStarting}
      onCancelEnrollment={() => setEnrollment(null)}
      onEnrollmentDone={() => setEnrollment(null)}
      onRegenerateBackupCodes={regenerateBackupCodes}
      onRemoveFactor={removeFactor}
      onStartEnrollment={startEnrollment}
      onVerifyEnrollment={verifyEnrollment}
      removingFactorId={removingId}
      status="ready"
    />
  );
}

export function DesignSystemAuthSecurityDemo() {
  return (
    <>
      <section className="scroll-mt-10 space-y-6" id="auth-mfa">
        <DesignSystemSectionHeader
          description="Two-factor sign-in challenge, authenticator enrollment, backup codes, and the account settings surface. All handlers are mocked."
          id="auth-mfa"
          title="Auth · Two-factor"
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sign-in challenge</CardTitle>
              <CardDescription>
                Shown after a correct password when a TOTP factor is enrolled.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mx-auto w-full max-w-sm">
                <MfaChallengeDemo />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authenticator enrollment</CardTitle>
              <CardDescription>
                QR code, manual setup key, and confirmation code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <EnrollmentPanelDemo />
              <DemoHint>
                Also used inline at sign-in when MFA is required.
              </DemoHint>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings · Two-factor</CardTitle>
              <CardDescription>
                Enabled state with a factor, plus the full enrollment flow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TwoFactorSettingsDemo />
              <DemoHint>Remove the factor to reach the setup state.</DemoHint>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
