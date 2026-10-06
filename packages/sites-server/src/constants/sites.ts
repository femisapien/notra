import type { SiteMounts } from "@notra/sites-core/types/deployment";

/** Where a new site mounts its areas unless the form says otherwise. */
export const DEFAULT_SITE_MOUNTS: SiteMounts = {
  blog: "/blog",
  changelog: "/changelog",
};
/** Tries at a free generated address before asking for another name. */
export const SITE_SLUG_ATTEMPTS = 20;
