import { describe, expect, mock, test } from "bun:test";

let started = 0;

mock.module("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));

mock.module("@/lib/auth/actions", () => ({
  getAllUserOrganizations: async () => [
    { id: "org-a", slug: "alpha" },
    { id: "org-b", slug: "beta" },
  ],
}));

mock.module("@/lib/billing/subscription", () => ({
  hasPaidSubscriptionHistory: async (organizationId: string) => {
    started += 1;
    await Bun.sleep(20);
    expect(started).toBe(2);
    return organizationId === "org-b";
  },
}));

const { redirectIfAnyOrganizationHasPaidHistory } =
  await import("../src/lib/onboarding/billing-gate");

describe("redirectIfAnyOrganizationHasPaidHistory", () => {
  test("starts paid-history checks in parallel and redirects to the first paid org", async () => {
    started = 0;
    await expect(redirectIfAnyOrganizationHasPaidHistory()).rejects.toThrow(
      "REDIRECT:/beta"
    );
  });
});
