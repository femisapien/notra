import type { siteJobs } from "@notra/db/schema";

import type { DeploymentOutcome } from "./deployments";

export type SiteJob = typeof siteJobs.$inferSelect;

export interface SiteJobOutcome {
  status: "done" | "retrying" | "failed" | "skipped";
  outcome?: DeploymentOutcome["kind"];
}

export interface FailSiteJobOptions {
  permanent?: boolean;
}
