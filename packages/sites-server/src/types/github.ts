export interface SiteRepository {
  installationId: string;
  owner: string;
  repo: string;
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
