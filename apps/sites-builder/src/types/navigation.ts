import type { LinkIcon } from "./icons";

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
