import type { SiteValidationResult } from "@notra/sites-compiler/types/validate";
import type { SiteDiagnostic } from "@notra/sites-core/types/build";

export interface SiteSourceFile {
  /** Relative to the site root, forward slashes, no leading slash. */
  path: string;
  size: number;
}

export interface CollectedSource {
  files: SiteSourceFile[];
  totalBytes: number;
  diagnostics: SiteDiagnostic[];
}

/** The collected files with the text of every text file (null for binary ones). */
export interface SiteFiles {
  collected: CollectedSource;
  files: Map<string, string | null>;
}

export interface PrepareSiteParams {
  siteRoot: string;
  workDir: string;
  /** Name custom scripts without a content hash (dev server). */
  stableAssetNames?: boolean;
}

export interface PreparedSite {
  validation: SiteValidationResult;
  collectDiagnostics: SiteDiagnostic[];
  /** Absolute URL paths of files in `public/`, e.g. `/images/logo.svg`. */
  publicFiles: string[];
  /** File names of `script.js` / `scripts/*.js` below `_notra/assets/`, in page order. */
  customScripts: string[];
}

/** What collecting makes of one path in the site source. */
export type Inspected =
  | { kind: "skip" }
  | { kind: "diagnostic"; diagnostic: SiteDiagnostic }
  | { kind: "directory"; path: string }
  | { kind: "file"; file: SiteSourceFile };
