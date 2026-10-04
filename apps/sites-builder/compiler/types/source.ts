import type {
  SiteEntry,
  SiteSourceFile,
} from "@notra/sites-compiler/types/diagnostics";
import type { SiteValidationResult } from "@notra/sites-compiler/types/validate";
import type { SiteDiagnostic } from "@notra/sites-core/types/build";

export interface CollectedSource {
  files: SiteSourceFile[];
  totalBytes: number;
  diagnostics: SiteDiagnostic[];
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
  entries: SiteEntry[];
  /** File names of `script.js` / `scripts/*.js` below `_notra/assets/`, in page order. */
  customScripts: string[];
}

/** What collecting makes of one path in the site source. */
export type Inspected =
  | { kind: "skip" }
  | { kind: "diagnostic"; diagnostic: SiteDiagnostic }
  | { kind: "directory"; path: string }
  | { kind: "file"; file: SiteSourceFile };
