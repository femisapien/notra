import type { SiteConfig } from "@notra/sites-core/types/site-config";

import type { LinkIcon } from "./icons";

export type NavbarLink = SiteConfig["navbar"]["links"][number];

/** A link with a label, a target and an optional Lucide icon name. */
export interface PlainLink {
  label: string;
  href: string;
  icon?: string;
}

/** A navbar or footer link with its icon resolved. */
export interface ResolvedLink {
  label: string;
  href: string;
  icon?: LinkIcon;
  /** Typed links without a custom label show only their icon in the navbar. */
  iconOnly: boolean;
}

export interface FooterColumn {
  header?: string;
  items: ResolvedLink[];
}
