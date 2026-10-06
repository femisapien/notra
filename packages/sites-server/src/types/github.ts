import type { githubIntegrations } from "@notra/db/schema";

export interface SiteRepository {
  installationId: string;
  owner: string;
  repo: string;
}

/** A repository the organization connected through the GitHub App. */
export interface OrganizationRepository {
  integration: typeof githubIntegrations.$inferSelect;
  repository: SiteRepository;
}

export interface SiteRepositoryAccess {
  repository: SiteRepository;
  token: string;
}

/** The repository columns of a site row. */
export interface SiteRepositoryColumns {
  githubInstallationId: string | null;
  repositoryOwner: string | null;
  repositoryName: string | null;
}

export interface SiteRepositoryPermissions {
  contents?: "read" | "write";
  checks?: "write";
  pull_requests?: "read" | "write";
}

export interface BranchHead {
  sha: string;
  protected: boolean;
  message: string | null;
  author: string | null;
}

export type CheckRunConclusion =
  | "success"
  | "failure"
  | "cancelled"
  | "neutral"
  | "skipped";

export interface CreateCheckRunParams {
  name: string;
  headSha: string;
  detailsUrl: string;
  externalId: string;
  title: string;
  summary: string;
}

export interface CheckRunAnnotation {
  path: string;
  start_line: number;
  end_line: number;
  annotation_level: "failure" | "warning" | "notice";
  message: string;
}

export interface CompleteCheckRunParams {
  checkRunId: string;
  conclusion: CheckRunConclusion;
  title: string;
  summary: string;
  text?: string;
  detailsUrl?: string;
  annotations?: CheckRunAnnotation[];
}

/** What the new-site and settings forms suggest for branch and root directory. */
export interface RepositorySuggestions {
  branches: string[];
  defaultBranch: string | null;
  /** Folders with a notra.json, `""` for the repository root. */
  configDirectories: string[];
  /** Posts per folder (`""` for the root), so a new site turns on the sections that have content. */
  contentCounts: Record<string, RepositoryContentCount>;
  /** GitHub cut the file tree short; some folders may be missing. */
  truncated: boolean;
}

export interface RepositoryContentCount {
  blog: number;
  changelog: number;
}

export interface RepositoryTreeScan {
  directories: string[];
  contentCounts: Record<string, RepositoryContentCount>;
  truncated: boolean;
}
