export interface SiteLink {
  label: string;
  href: string;
}

export interface FontSpec {
  family?: string;
  weight?: number;
  source?: string;
  format?: "woff" | "woff2";
}

/** notra.json after validation (see @notra/sites-core site-config schema). */
export interface SiteThemeConfig {
  theme: "notra";
  name: string;
  description?: string;
  logo?: string | { light: string; dark: string; href?: string };
  favicon?: string | { light: string; dark: string };
  colors: { primary: string; light?: string; dark?: string };
  appearance: { default: "light" | "dark" | "system"; strict: boolean };
  fonts?: FontSpec & { heading?: FontSpec; body?: FontSpec };
  background: {
    decoration: "none" | "grid" | "dots" | "gradient";
    color?: { light?: string; dark?: string };
  };
  styling: {
    codeblocks: "system" | "dark" | string | { light: string; dark: string };
  };
  navbar: { links: SiteLink[]; cta?: SiteLink };
  footer: { links: SiteLink[]; socials: Record<string, string> };
  blog?: { title?: string; description?: string };
  changelog?: { title?: string; description?: string };
}

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
