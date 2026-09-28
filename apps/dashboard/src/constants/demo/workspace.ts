import type { UseCustomerResult } from "autumn-js/react";

import type { InitialActiveOrganization } from "@/components/providers/organization-provider";
import type { ClientSessionData } from "@/types/auth/session";
import type { BrandSettings } from "@/types/hooks/brand-analysis";

export const DEMO_ORGANIZATION = {
  id: "public-demo-neon",
  name: "Neon",
  slug: "demo",
  logo: null,
  createdAt: new Date("2026-09-01T00:00:00Z"),
  metadata: null,
  heardAboutNotraSource: null,
  heardAboutNotraOther: null,
  geoIngestTokenGeneration: 1,
  feedbackIngestTokenGeneration: 1,
  onboardingCompleted: true,
  onboardingDismissed: true,
  onboardingAgentRan: true,
  onboardingAgentStartedAt: null,
  workosOrgId: null,
} satisfies InitialActiveOrganization;
export const DEMO_SESSION: ClientSessionData = {
  session: {
    userId: "public-demo-user",
    activeOrganizationId: DEMO_ORGANIZATION.id,
    impersonatedBy: null,
  },
  user: {
    id: "public-demo-user",
    name: "Jamie",
    email: "demo@example.com",
    emailVerified: true,
    image: null,
    role: "user",
    hidePersonalData: false,
    showAgentStats: false,
    locale: "en",
    createdAt: new Date("2026-09-01T00:00:00Z"),
  },
};
export const DEMO_BRAND: BrandSettings = {
  id: "demo-neon-brand",
  organizationId: DEMO_ORGANIZATION.id,
  name: "Neon",
  isDefault: true,
  websiteUrl: "https://neon.com",
  companyName: "Neon",
  companyDescription:
    "Serverless Postgres with database branching, autoscaling, and scale to zero.",
  toneProfile: "Professional",
  customTone: null,
  customInstructions:
    "Technical, clear, and practical. Show developers how things work.",
  audience: "Developers building applications with Postgres",
  language: "en",
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-28T00:00:00Z",
};
export const DEMO_CUSTOMER: NonNullable<UseCustomerResult["data"]> = {
  id: DEMO_ORGANIZATION.id,
  name: "Neon",
  email: "demo@example.com",
  createdAt: 1788220800000,
  fingerprint: null,
  stripeId: null,
  env: "sandbox",
  metadata: {},
  sendEmailReceipts: false,
  billingControls: {},
  subscriptions: [
    {
      id: "demo-subscription",
      planId: "growth",
      autoEnable: false,
      addOn: false,
      status: "active",
      pastDue: false,
      canceledAt: null,
      expiresAt: null,
      trialEndsAt: null,
      startedAt: 1788220800000,
      currentPeriodStart: 1788220800000,
      currentPeriodEnd: 1790812800000,
      quantity: 1,
    },
  ],
  purchases: [],
  flags: {},
  balances: Object.fromEntries(
    ["ai_answers", "ai_credits"].map((featureId) => [
      featureId,
      {
        featureId,
        feature: {
          id: featureId,
          name: featureId === "ai_answers" ? "AI answers" : "AI credits",
          type: "metered",
          consumable: true,
          archived: false,
        },
        granted: 10000,
        remaining: 8200,
        usage: 1800,
        unlimited: false,
        overageAllowed: false,
        maxPurchase: null,
        nextResetAt: null,
      },
    ])
  ),
};
