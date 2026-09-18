import { redirect } from "next/navigation";

import { getAllUserOrganizations } from "@/lib/auth/actions";
import { hasPaidSubscriptionHistory } from "@/lib/billing/subscription";

async function firstMatch<T>(
  lookups: readonly Promise<T | null>[]
): Promise<T | null> {
  if (lookups.length === 0) {
    return null;
  }
  const [head, ...tail] = lookups;
  return (await head) ?? firstMatch(tail);
}

export async function redirectIfAnyOrganizationHasPaidHistory() {
  const allOrgs = await getAllUserOrganizations();
  const paidOrg = await firstMatch(
    allOrgs.map((org) =>
      hasPaidSubscriptionHistory(org.id).then((paid) => (paid ? org : null))
    )
  );
  if (paidOrg) {
    redirect(`/${paidOrg.slug}`);
  }
}
