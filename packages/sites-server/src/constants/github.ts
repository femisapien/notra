import { SITE_BUILD_LIMITS } from "@notra/sites-core/constants/sites";

export const GITHUB_API_VERSION_HEADER = {
  "X-GitHub-Api-Version": "2022-11-28",
} as const;
/** Compressed tarball budget; the uncompressed source limit is enforced again in the sandbox. */
export const MAX_TARBALL_BYTES = SITE_BUILD_LIMITS.maxSourceBytes;
export const CHECK_RUN_NAME = "Notra Sites";

/** Branch suggestions stop here; anything else can still be typed. */
export const BRANCH_SUGGESTION_LIMIT = 300;
export const GITHUB_PAGE_SIZE = 100;
/**
 * A post or changelog entry: `[<folder>/]blog/…/x.md(x)`. The greedy folder
 * picks the innermost blog/ or changelog/, so `apps/site/blog/a.md` counts for
 * `apps/site`.
 */
export const CONTENT_FILE = /^(?:(.*)\/)?(blog|changelog)\/.+\.mdx?$/;

/** Dependency folders never hold a site's notra.json. */
export const CONFIG_SEARCH_SKIPPED_SEGMENTS: ReadonlySet<string> = new Set([
  "node_modules",
  ".git",
  "vendor",
]);
