import type { SiteDiagnostic } from "@notra/sites-core/types/build";
import type { SiteConfig } from "@notra/sites-core/types/site-config";

import type { SiteEntry } from "./diagnostics";

export interface SiteValidationInput {
  /** Site-relative path → text content (null for binary files). */
  files: ReadonlyMap<string, string | null>;
}

export interface SiteValidationResult {
  diagnostics: SiteDiagnostic[];
  config: SiteConfig | null;
  entries: SiteEntry[];
  /** Transformed MDX/JSX sources plus generated inline modules, keyed by site path. */
  outputs: Map<string, string>;
  ok: boolean;
}

/** A file under `blog/` or `changelog/` that would become an entry, before validation. */
export interface EntryCandidate {
  area: SiteEntry["area"];
  slug: string;
  format: SiteEntry["format"];
}
