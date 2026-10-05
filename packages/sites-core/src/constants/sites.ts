import {
  SITE_CHROME_FILES,
  SITE_SLOTS_DIR,
} from "@notra/sites-core/constants/site-layout";
import type { SiteDeploymentStatus } from "@notra/sites-core/types/sites";

export const SITE_AREAS = ["blog", "changelog"] as const;

export const SITE_CONFIG_FILENAME = "notra.json";
/** Public JSON Schema of `notra.json`, generated from `siteConfigSchema` (see scripts/generate-json-schema.ts). */
export const SITE_CONFIG_SCHEMA_URL = "https://usenotra.com/schemas/notra.json";

/** Every built area keeps its own assets below its mount, so a customer proxy only has to forward the mount path. */
export const SITE_ASSETS_DIR = "_notra/assets";
export const SITE_INTERNAL_PATH_SEGMENT = "_notra";
export const SITE_PROBE_FILENAME = "probe.txt";
export const SITE_ROUTES_FILENAME = "routes.json";

export const SITE_PREVIEW_HOST_SEPARATOR = "--";
export const SITE_PREVIEW_KEY_MAX_LENGTH = 40;
export const SITE_SLUG_MIN_LENGTH = 3;
export const SITE_SLUG_MAX_LENGTH = 40;
export const DNS_LABEL_MAX_LENGTH = 63;
export const SITE_RESERVED_SLUGS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "assets",
  "cdn",
  "docs",
  "mail",
  "notra",
  "preview",
  "previews",
  "static",
  "status",
]);
export const SITE_MOUNT_MAX_SEGMENTS = 3;
export const SITE_MAX_REMOVED_PREVIEWS = 200;

export const SITE_PREVIEW_COOKIE = "__notra_preview";
export const SITE_PREVIEW_AUTH_PATH = "/_notra/auth";
/** Share-link and password sessions. */
export const SITE_PREVIEW_SESSION_SECONDS = 60 * 60 * 12;
/**
 * Member sessions are short: the dashboard re-checks membership every hour.
 * The cookie outlives the token so the worker can renew it silently by
 * bouncing through the dashboard (no click) while the member is signed in.
 */
export const SITE_PREVIEW_MEMBER_SESSION_SECONDS = 60 * 60;
export const SITE_PREVIEW_MEMBER_RENEW_SECONDS = 60 * 60 * 24 * 7;
export const SITE_PREVIEW_SHARE_LINK_SECONDS = 60 * 60 * 24 * 7;
/** Sign-out link on preview hosts; clears the preview session cookie. */
export const SITE_PREVIEW_SIGN_OUT_PATH = "/_notra/auth/sign-out";

/**
 * Preview passwords are stored as PBKDF2-SHA256 hashes in the serving state.
 * 100k iterations is the most Workers' WebCrypto accepts for PBKDF2.
 */
export const SITE_PREVIEW_PASSWORD_ALGORITHM = "PBKDF2-SHA256";
export const SITE_PREVIEW_PASSWORD_ITERATIONS = 100_000;
export const SITE_PREVIEW_PASSWORD_SALT_BYTES = 16;
export const SITE_PREVIEW_PASSWORD_HASH_BYTES = 32;
export const SITE_PREVIEW_PASSWORD_MIN_LENGTH = 8;
export const SITE_PREVIEW_PASSWORD_MAX_LENGTH = 128;

export const SITE_BUILD_LIMITS = {
  /** Wall clock for the whole sandbox build, both areas included. */
  buildTimeoutSeconds: 10 * 60,
  maxOutputBytes: 500 * 1024 * 1024,
  maxOutputFiles: 20_000,
  maxSingleFileBytes: 25 * 1024 * 1024,
  /** Source upload into the sandbox, after filtering to the files a site can use. */
  maxSourceBytes: 200 * 1024 * 1024,
  maxSourceFiles: 10_000,
  maxBuildLogBytes: 512 * 1024,
  /** Sandboxes building at once, across all customers. */
  maxConcurrentBuilds: 20,
  /** Sandboxes building at once for one site; more wait instead of piling up. */
  maxConcurrentBuildsPerSite: 2,
  /** Deployments one organization may queue per 24 hours (pushes, previews, redeploys). */
  maxDeploymentsPerOrganizationPerDay: 300,
} as const;

export const SITE_SOURCE_ROOT_ENTRIES = [
  SITE_CONFIG_FILENAME,
  "blog",
  "changelog",
  "snippets",
  "public",
  // Custom CSS, loaded on every page after the theme so it can override it.
  "style.css",
  "styles",
  // Custom JavaScript, loaded on every page with `defer`.
  "script.js",
  "scripts",
  // `header.mdx` / `footer.mdx` replace the theme's chrome; `slots/*.mdx` fill fixed places on its pages.
  ...SITE_CHROME_FILES,
  SITE_SLOTS_DIR,
] as const;

/** `script.js` and every `.js` file below `scripts/`; copied as-is, never executed by the build. */
export const SITE_CUSTOM_SCRIPT_FILENAME = "script.js";
export const SITE_CUSTOM_SCRIPTS_DIR = "scripts";

export const SITE_SOURCE_EXTENSIONS = [
  ".md",
  ".mdx",
  ".jsx",
  ".js",
  ".json",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".svg",
  ".ico",
  ".mp4",
  ".webm",
  ".pdf",
  ".txt",
  ".woff",
  ".woff2",
  ".css",
] as const;

/** Hooks available in inline and snippet components without an import; the compiler adds it. */
export const SITE_INJECTED_REACT_HOOKS = [
  "useState",
  "useEffect",
  "useRef",
  "useCallback",
  "useMemo",
  "useContext",
  "useReducer",
  "useId",
  "useLayoutEffect",
  "useTransition",
  "useDeferredValue",
] as const;

export const SITE_DEPLOYMENT_KINDS = ["production", "preview"] as const;

/**
 * Lifecycle of a build. Whether a deployment is *live* is not a status: the
 * serving state in R2 is the only authority for that (see `referencedDeploymentIds`).
 * `ready` = built and stored, so it can go live or be restored later;
 * `expired` = its files were cleaned up.
 */
export const SITE_DEPLOYMENT_STATUSES = [
  "queued",
  "building",
  "uploading",
  "ready",
  "superseded",
  "failed",
  "canceled",
  "expired",
] as const;

/** Allowed previous statuses per target status; every status write goes through this table. */
export const SITE_DEPLOYMENT_TRANSITIONS: Record<
  SiteDeploymentStatus,
  readonly SiteDeploymentStatus[]
> = {
  queued: [],
  // A retried job (expired lease) re-enters the step it crashed in.
  building: ["queued", "building"],
  uploading: ["building", "uploading"],
  ready: ["uploading"],
  superseded: ["queued"],
  failed: ["queued", "building", "uploading"],
  canceled: ["queued", "building", "uploading"],
  expired: ["ready"],
};

export const SITE_DEPLOYMENT_IN_PROGRESS_STATUSES = [
  "queued",
  "building",
  "uploading",
] as const;

export const SITE_DEPLOYMENT_TRIGGERS = [
  "push",
  "pull_request",
  "manual",
  "redeploy",
  "config",
] as const;

export const SITE_PREVIEW_VISIBILITIES = ["public", "protected"] as const;
export const SITE_PUBLISH_MODES = ["pull_request", "direct"] as const;
export const SITE_STATUSES = ["active", "suspended"] as const;
export const SITE_DOMAIN_KINDS = ["subdomain", "proxy"] as const;
export const SITE_DOMAIN_STATUSES = [
  "pending",
  "verifying",
  "active",
  "failed",
] as const;

/** R2 key layout. Everything lives in a private bucket; only the sites worker reads it. */
export const SITE_R2_KEYS = {
  host: (hostname: string) => `hosts/${hostname}.json`,
  state: (siteId: string) => `sites/${siteId}/state.json`,
  deploymentPrefix: (siteId: string, deploymentId: string) =>
    `deployments/${siteId}/${deploymentId}/`,
  manifest: (siteId: string, deploymentId: string) =>
    `deployments/${siteId}/${deploymentId}/manifest.json`,
  file: (siteId: string, deploymentId: string, path: string) =>
    `deployments/${siteId}/${deploymentId}/files${path}`,
  buildLog: (siteId: string, deploymentId: string) =>
    `logs/${siteId}/${deploymentId}.log`,
} as const;
