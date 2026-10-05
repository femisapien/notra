import type { GitHubPublishContentType } from "@/types/integrations/github";

/** The Notra Site that builds from the repository a post is published to. */
export interface SiteGitHubPublishTarget {
  siteId: string;
  /** Folder with notra.json, without leading or trailing slashes ("" = repo root). */
  rootDirectory: string;
  productionBranch: string;
  /** Whether the site serves the section this post belongs to. */
  sectionMounted: boolean;
}

/** `authors` in notra.json, reduced to what publishing needs. */
export type SiteConfigAuthorNames = Record<string, string>;

export interface BuildSiteEntryMarkdownParams {
  contentType: GitHubPublishContentType;
  markdown: string;
  title: string;
  /** Written as `date: YYYY-MM-DD` (UTC). */
  date: Date;
  /** Author id from notra.json or a plain display name (blog posts only). */
  author?: string | null;
}

export interface SiteMarkdownNode {
  alt?: string | null;
  children?: SiteMarkdownNode[];
  depth?: number;
  type: string;
  url?: string;
  value?: string;
}
