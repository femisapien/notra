/** The subset of R2 the worker uses, so tests can pass an in-memory bucket. */
export interface SiteBucketObject {
  body: ReadableStream | null;
  text(): Promise<string>;
}

export interface SiteBucket {
  get(key: string): Promise<SiteBucketObject | null>;
}

export interface SiteEdgeCache {
  match(key: string): Promise<Response | undefined>;
  put(key: string, response: Response): Promise<void>;
}

export interface SitesEnv {
  SITES_BUCKET: R2Bucket;
  HOSTING_DOMAIN: string;
  DASHBOARD_URL: string;
  PREVIEW_SECRET: string;
  /** Dev only: lets requests to *.workers.dev pick a site host via `x-notra-host`. */
  DEV_HOST_OVERRIDE_TOKEN?: string;
  /** Workers Rate Limiting binding for preview password attempts (per client and preview). */
  PREVIEW_PASSWORD_LIMITER?: RateLimit;
  /** Notra's AI traffic ingest (`…/api/geo/ingest`). Unset: no traffic is reported. */
  TRAFFIC_INGEST_URL?: string;
}

/** The part of a Workers rate limiter the worker uses. */
export interface PasswordAttemptLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface SitesDeps {
  bucket: SiteBucket;
  cache: SiteEdgeCache | null;
  hostingDomain: string;
  dashboardUrl: string;
  previewSecret: string;
  devHostOverrideToken: string | null;
  /** Without one, PBKDF2 cost is the only brake on password guessing. */
  passwordAttemptLimiter: PasswordAttemptLimiter | null;
  /** Where production page views are reported for AI traffic analytics; null turns it off. */
  trafficIngestUrl: string | null;
  fetch: (url: string, init: RequestInit) => Promise<Response>;
  waitUntil: (promise: Promise<unknown>) => void;
  now: () => Date;
}
