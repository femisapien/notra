import { moderateSiteName } from "@notra/ai/jobs/site-name-moderation";
import { db } from "@notra/db/drizzle";
import { organizations, siteSlugGrants, users } from "@notra/db/schema";
import { eq } from "drizzle-orm";

import {
  reservedSlugMessage,
  SITE_NAME_REJECTION_MESSAGES,
  SITE_PROTECTED_SLUG_WORDS,
  SITE_RESERVED_BRAND_SLUGS,
} from "./constants/moderation";

/**
 * A reserved address belongs to whoever controls its company's mailboxes: a
 * verified `@stripe.com` (or `@eu.stripe.com`) address may take `stripe`.
 */
async function ownsReservedDomain(
  userId: string,
  domain: string
): Promise<boolean> {
  const user = await db.query.users.findFirst({
    columns: { email: true, emailVerified: true },
    where: eq(users.id, userId),
  });
  const emailDomain = user?.email.split("@")[1]?.toLowerCase();
  if (!(user?.emailVerified && emailDomain)) {
    return false;
  }
  return emailDomain === domain || emailDomain.endsWith(`.${domain}`);
}

/**
 * Every site lives on a public subdomain of Notra's hosting domain, so its
 * name and address are screened before they go live: offensive names and
 * names posing as another organization are refused, and popular companies'
 * addresses are kept for the companies themselves. Returns why a name is
 * refused, or null when it may be used.
 */
export async function siteNameRejection(params: {
  organizationId: string;
  userId: string;
  name: string;
  address: string;
  slug?: string;
}): Promise<string | null> {
  if (
    params.slug?.split("-").some((word) => SITE_PROTECTED_SLUG_WORDS.has(word))
  ) {
    return SITE_NAME_REJECTION_MESSAGES.impersonation;
  }
  // A hand-granted address belongs to one organization, reserved or not.
  const grant = params.slug
    ? await db.query.siteSlugGrants.findFirst({
        columns: { organizationId: true },
        where: eq(siteSlugGrants.slug, params.slug),
      })
    : undefined;
  if (grant) {
    return grant.organizationId === params.organizationId
      ? null
      : SITE_NAME_REJECTION_MESSAGES.granted;
  }
  const reservedFor = params.slug
    ? SITE_RESERVED_BRAND_SLUGS[params.slug]
    : undefined;
  if (reservedFor) {
    // The company's own people pass; nobody else gets its address.
    return (await ownsReservedDomain(params.userId, reservedFor))
      ? null
      : reservedSlugMessage(params.slug ?? "", reservedFor);
  }
  const organization = await db.query.organizations.findFirst({
    columns: { name: true },
    where: eq(organizations.id, params.organizationId),
  });
  const verdict = await moderateSiteName({
    organizationId: params.organizationId,
    organizationName: organization?.name ?? "",
    name: params.name,
    address: params.address,
  });
  return verdict ? SITE_NAME_REJECTION_MESSAGES[verdict] : null;
}
