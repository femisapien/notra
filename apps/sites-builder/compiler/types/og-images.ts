import type { SiteEntry } from "@notra/sites-compiler/types/diagnostics";
import type { SiteDiagnostic } from "@notra/sites-core/types/build";
import type { SiteConfig } from "@notra/sites-core/types/site-config";

export interface WriteOgImagesParams {
  workDir: string;
  config: SiteConfig;
  entries: readonly SiteEntry[];
  /** Absolute URL paths of files in `public/`, e.g. `/images/og.png`. */
  publicFiles: readonly string[];
  includeDrafts: boolean;
}

/** `"<area>/<slug>"` → image path below the area's mount. */
export type OgManifest = Record<string, string>;

export interface OgImagesResult {
  manifest: OgManifest;
  diagnostics: SiteDiagnostic[];
  durationMs: number;
}

/** What one share image shows. */
export interface OgCardContent {
  /** "Acme Blog", or "Acme · Changelog". */
  eyebrow: string;
  title: string;
  /** "October 1, 2026", plus the version for changelog entries. */
  footer: string;
  appearance: "light" | "dark";
  accent: string;
  /** Data URI of the repository background image. */
  background?: string;
}
