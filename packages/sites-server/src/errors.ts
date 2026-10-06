import type { SiteInputField } from "./types/sites";

/** A required `SITES_*` environment variable is missing. */
export class SitesNotConfiguredError extends Error {
  readonly name = "SitesNotConfiguredError";
}

/** A request the user can fix; `field` points the dashboard at the form input. */
export class SiteInputError extends Error {
  readonly name = "SiteInputError";
  readonly field: SiteInputField | null;

  constructor(message: string, options?: { field?: SiteInputField }) {
    super(message);
    this.field = options?.field ?? null;
  }
}

/** The site is suspended or its organization used up the deployment quota. */
export class SiteNotBuildableError extends Error {
  readonly name = "SiteNotBuildableError";
}

/** Files changed on GitHub since their drafts were started, or the branch moved while publishing. */
export class SitePublishConflictError extends Error {
  readonly name = "SitePublishConflictError";
  readonly paths: string[];

  constructor(paths: string[], message: string) {
    super(message);
    this.paths = paths;
  }
}

/** A hostname another site already registered. */
export class SiteHostConflictError extends Error {
  readonly name = "SiteHostConflictError";
}

/** An R2 conditional write (If-Match / If-None-Match) lost. */
export class R2PreconditionFailedError extends Error {
  readonly name = "R2PreconditionFailedError";
}

/**
 * A build problem that will happen again on every retry (oversized or unsafe
 * output, repository too large, repository disconnected). The job fails at
 * once instead of burning more sandbox builds.
 */
export class SitePermanentBuildError extends Error {
  readonly name = "SitePermanentBuildError";
}

/** The sandbox output contains links, devices, escaping paths or too much data. */
export class UnsafeArchiveError extends SitePermanentBuildError {}
