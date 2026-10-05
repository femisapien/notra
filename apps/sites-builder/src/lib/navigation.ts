import { PLATFORM_LABELS } from "../constants/navigation";
import type { FooterColumn, ResolvedLink } from "../types/navigation";
import { brandIcon, lucideIcon } from "../utils/icons";
import { config } from "./params";

type NavbarLink = (typeof config.navbar.links)[number];
type PlainLink = { label: string; href: string; icon?: string };

function plainLink(link: PlainLink): ResolvedLink {
  return {
    label: link.label,
    href: link.href,
    icon: lucideIcon(link.icon),
    iconOnly: false,
  };
}

function navbarLink(link: NavbarLink): ResolvedLink {
  if ("type" in link) {
    return {
      label: link.label ?? PLATFORM_LABELS[link.type],
      href: link.href,
      icon: brandIcon(link.type),
      iconOnly: !link.label,
    };
  }
  return plainLink(link);
}

export function navbarLinks(): ResolvedLink[] {
  return config.navbar.links.map(navbarLink);
}

export function navbarCta(): ResolvedLink | undefined {
  return config.navbar.cta ? plainLink(config.navbar.cta) : undefined;
}

/** The typed button next to the CTA (e.g. GitHub). */
export function navbarPrimary(): ResolvedLink | undefined {
  const primary = config.navbar.primary;
  if (!primary) {
    return undefined;
  }
  return {
    label: PLATFORM_LABELS[primary.type],
    href: primary.href,
    icon: brandIcon(primary.type),
    iconOnly: false,
  };
}

/** Flat links stay one inline row; columns get their own grid. */
export function footerColumns(): FooterColumn[] {
  return config.footer.links.flatMap((item) =>
    "items" in item
      ? [{ header: item.header, items: item.items.map(plainLink) }]
      : []
  );
}

export function footerFlatLinks(): ResolvedLink[] {
  return config.footer.links.flatMap((item) =>
    "items" in item ? [] : [plainLink(item)]
  );
}

export function footerSocials(): ResolvedLink[] {
  return Object.entries(config.footer.socials).flatMap(([platform, url]) =>
    url
      ? [
          {
            label:
              PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] ??
              platform,
            href: url,
            icon: brandIcon(platform),
            iconOnly: true,
          },
        ]
      : []
  );
}
