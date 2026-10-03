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
}

export interface PreparedSite {
  validation: SiteValidationResult;
  collectDiagnostics: SiteDiagnostic[];
  /** Absolute URL paths of files in `public/`, e.g. `/images/logo.svg`. */
  publicFiles: string[];
  entries: SiteEntry[];
}
