import type {
  SiteManifest,
  SiteManifestFile,
} from "@notra/sites-core/types/deployment";

import type { SitesDeps } from "./worker";

/** The deployment a request resolved to, after host, takedown and preview checks. */
export interface ResolvedDeployment {
  siteId: string;
  deploymentId: string;
  isPreview: boolean;
  /** Production only: previews are never reported as traffic. */
  trafficToken: string | null;
}

export interface LoadedManifest {
  manifest: SiteManifest;
  files: Map<string, SiteManifestFile>;
}

/** An isolate-local cache entry and the time (ms) it was read. */
export interface TimedCacheEntry<T> {
  value: T;
  at: number;
}

export interface ServeFileParams {
  deps: SitesDeps;
  request: Request;
  siteId: string;
  deploymentId: string;
  file: SiteManifestFile;
  status: number;
  isPreview: boolean;
  /** The deployment's policy from its manifest; only sent with HTML. */
  contentSecurityPolicy?: string;
  extraHeaders?: Record<string, string>;
}

export interface RedirectMatch {
  location: string;
  status: number;
}

/** Where an agent that hit a missing page should look instead. */
export interface MarkdownNotFoundParams {
  path: string;
  /** The area's Markdown index, when the path is inside an area. */
  indexPath: string | null;
  llmsPath: string;
}
