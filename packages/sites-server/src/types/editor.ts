import type { siteDrafts } from "@notra/db/schema";

import type { SiteRepository } from "./github";

export type SiteDraft = typeof siteDrafts.$inferSelect;

export type SiteDraftPublishMode = "direct" | "pull_request";

export interface SiteSourceEntry {
  /** Relative to the site root. */
  path: string;
  sha: string;
  size: number;
}

export interface SiteSourceListing {
  commitSha: string;
  files: SiteSourceEntry[];
}

export interface SiteSourceFileContent {
  content: string;
  sha: string;
}

export interface SiteRepositoryReadAccess {
  repository: SiteRepository;
  token: string;
}

export interface SaveSiteDraftInput {
  path: string;
  content: string;
  baseBlobSha: string | null;
  baseCommitSha: string | null;
  deleted?: boolean;
  userId: string;
}

export interface PublishSiteDraftsInput {
  message: string;
  mode: SiteDraftPublishMode;
  userId: string;
}

export interface PublishSiteDraftsResult {
  mode: SiteDraftPublishMode;
  commitSha: string;
  pullRequestUrl: string | null;
}

export interface RepositoryCommitInput {
  branch: string;
  headline: string;
  expectedHeadOid: string;
  /** Paths from the repository root, with UTF-8 contents. */
  additions: Array<{ path: string; content: string }>;
  deletions: string[];
}

export interface RepositoryPullRequestInput {
  title: string;
  head: string;
  base: string;
  body: string;
}
