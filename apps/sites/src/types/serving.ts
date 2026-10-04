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
  extraHeaders?: Record<string, string>;
}

export interface RedirectMatch {
  location: string;
  status: number;
}
