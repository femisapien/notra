import { redirect } from "next/navigation";

import { getAllUserOrganizations } from "@/lib/auth/actions";
import { hasPaidSubscriptionHistory } from "@/lib/billing/subscription";

export async function redirectIfAnyOrganizationHasPaidHistory() {
  const allOrgs = await getAllUserOrganizations();
  const paidLookups = allOrgs.map(async (org) =>
    (await hasPaidSubscriptionHistory(org.id)) ? org : null
  );
  for (const paidOrg of paidLookups) {
    const org = await paidOrg;
    if (org) {
      redirect(`/${org.slug}`);
    }
  }
}
