import type { SITE_SLOT_NAMES } from "@notra/sites-core/constants/site-layout";

export type SlotName = (typeof SITE_SLOT_NAMES)[number];

/** A compiled customer MDX file; its default export renders like any Astro component. */
export interface SiteMdxModule {
  default: (props: Record<string, unknown>) => unknown;
}

/** `site` prop of the hero slots. */
export interface SlotSite {
  name: string;
  description?: string;
}

/** `area` prop of the hero slots. */
export interface SlotArea {
  id: "blog" | "changelog";
  title: string;
  description?: string;
  url: string;
}

/** `post` prop of before-post, after-post and sidebar. */
export interface SlotPost {
  title: string;
  description?: string;
  /** Display date, e.g. "Oct 5, 2026". */
  date: string;
  tags: string[];
  authors: { name: string; title?: string; url?: string }[];
  url: string;
}

/** `entry` prop of after-changelog-entry. */
export interface SlotChangelogEntry {
  title: string;
  version?: string;
  date: string;
  url: string;
}
