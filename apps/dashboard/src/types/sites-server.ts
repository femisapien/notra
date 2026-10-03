import type { siteDeployments, siteDomains } from "@notra/db/schema";
import type { Site } from "@notra/sites-server/types/sites";

export type SiteDeploymentDbRow = typeof siteDeployments.$inferSelect;
export type SiteDomainDbRow = typeof siteDomains.$inferSelect;

/** What the serving state says is live, keyed by deployment id → since when. */
export type LiveDeployments = Map<string, string>;

/** The request context a site procedure checks access with. */
export interface SiteRequestContext {
  headers: Headers;
}

export interface SiteAccessOptions {
  /** Only owners and admins may continue. */
  admin?: boolean;
}

/** A site the caller may act on, and who the caller is. */
export interface SiteAccess {
  site: Site;
  userId: string;
}

export interface SiteJobSweepResult {
  dispatched: number;
  reaped: number;
}

export interface SiteJobRunHandle {
  runId: string;
}
