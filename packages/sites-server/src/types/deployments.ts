import type { db } from "@notra/db/drizzle";
import type { siteDeployments } from "@notra/db/schema";
import type {
  SiteBuildResult,
  SiteDiagnostic,
} from "@notra/sites-core/types/build";
import type { SiteServingState } from "@notra/sites-core/types/deployment";

import type { Site } from "./sites";

export type SiteDeployment = typeof siteDeployments.$inferSelect;
export type SiteDeploymentStatus = SiteDeployment["status"];
export type DeploymentExecutor = Pick<typeof db, "update">;
export type DeploymentTransitionValues = Partial<
  Omit<typeof siteDeployments.$inferInsert, "status">
>;

export interface EnqueueDeploymentInput {
  siteId: string;
  kind: "production" | "preview";
  previewKey: string | null;
  trigger: SiteDeployment["trigger"];
  branch: string;
  commitSha: string;
  commitMessage?: string | null;
  commitAuthor?: string | null;
  pullRequestNumber?: number | null;
  requestedByUserId?: string | null;
}

export interface EnqueuedDeployment {
  deployment: SiteDeployment;
  jobId: string;
}

/** How a deployment ended. Every path reports through `reportOutcome`, nowhere else. */
export type DeploymentOutcome =
  | { kind: "live" }
  /** Built and stored, but a newer deployment was already live. */
  | { kind: "not_live" }
  /** Not built: suspended site, newer commit, or preview closed. */
  | { kind: "skipped"; reason: string }
  | { kind: "failed"; summary: string; diagnostics: SiteDiagnostic[] };

/** Whether an activation reached the serving state, or a newer deployment kept it. */
export type ActivationOutcome = "live" | "not_live";

export interface LiveDeployments {
  previews: SiteServingState["previews"];
  ids: Set<string>;
}

export interface PublishDeploymentFilesParams {
  site: Site;
  deployment: SiteDeployment;
  archive: Uint8Array<ArrayBuffer>;
  result: SiteBuildResult;
  toolchainVersion: string | null;
}
