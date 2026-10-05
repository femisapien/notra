import type { SiteConfig } from "@notra/sites-core/types/site-config";

/**
 * notra.json after validation: the schema's output type, so every default the
 * schema fills in (layout, contextual, seo…) is guaranteed here and can't drift.
 */
export type SiteThemeConfig = SiteConfig;

/** A `<head>` script from integrations or the customer's `script.js` / `scripts/*.js` (see @notra/sites-core). */
export type HeadScript =
  | { kind: "external"; src: string; attributes: Record<string, string | true> }
  | { kind: "inline"; code: string };

/** Written by the notra-sites CLI for each area build; already validated there. */
export interface BuildParams {
  area: "blog" | "changelog";
  mount: string;
  publicOrigin: string;
  siteId: string;
  deploymentId: string;
  noindex: boolean;
  includeDrafts: boolean;
  /** "Powered by Notra" badge in the footer (site setting). */
  branding: boolean;
  workDir: string;
  publicFiles: string[];
  /** Mounts of every area, for cross-links between blog and changelog. */
  mounts: { blog?: string; changelog?: string };
  config: SiteThemeConfig;
  /** Rendered as-is at the end of `<head>`; inline code is already escaped. */
  headScripts: HeadScript[];
}
