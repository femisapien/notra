import { SITE_BUILD_LIMITS } from "@notra/sites-core/constants/sites";

export const GITHUB_API_VERSION_HEADER = {
  "X-GitHub-Api-Version": "2022-11-28",
} as const;
/** Compressed tarball budget; the uncompressed source limit is enforced again in the sandbox. */
export const MAX_TARBALL_BYTES = SITE_BUILD_LIMITS.maxSourceBytes;
export const CHECK_RUN_NAME = "Notra Sites";
