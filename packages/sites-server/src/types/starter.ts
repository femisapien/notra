import type { SITE_SOCIAL_PLATFORMS } from "@notra/sites-core/constants/site-layout";

export type StarterSocialPlatform = (typeof SITE_SOCIAL_PLATFORMS)[number];

export interface StarterLink {
  label: string;
  /** Absolute https URL (or mailto:). */
  href: string;
}

/** What one landing page says about the brand, read from its HTML. */
export interface LandingPageFacts {
  title: string | null;
  siteName: string | null;
  description: string | null;
  /** The image in the page header, if it is an <img> (inline SVG logos cannot be reused). */
  headerLogoUrl: string | null;
  /** Best icon: an SVG icon, the apple-touch-icon or the largest declared icon. */
  iconUrl: string | null;
  /** A non-media `theme-color`. */
  themeColor: string | null;
  /** `theme-color` per `prefers-color-scheme`, usually the page background. */
  themeColorLight: string | null;
  themeColorDark: string | null;
  /** Google Fonts family names, in the order the page loads them. */
  fontFamilies: string[];
  navLinks: StarterLink[];
  cta: StarterLink | null;
  footerLinks: StarterLink[];
  socials: Partial<Record<StarterSocialPlatform, string>>;
}

export interface StarterBrandLogo {
  light: string;
  dark: string | null;
  /** A wordmark already contains the name, so the header leaves the text out. */
  wordmark: boolean;
}

/** Everything the starter files are generated from; brand identity wins over the page. */
export interface StarterBrandInput {
  name: string;
  description: string | null;
  websiteUrl: string | null;
  logo: StarterBrandLogo | null;
  colors: {
    primary: string | null;
    primaryDark: string | null;
    backgroundLight: string | null;
    backgroundDark: string | null;
  };
  fonts: { heading: string | null; body: string | null };
  landing: LandingPageFacts | null;
}

export interface StarterFile {
  /** Relative to the site root. */
  path: string;
  content: string;
}

export interface SiteStarterFiles {
  files: StarterFile[];
}

export interface SiteStarterScope {
  organizationId: string;
  repositoryId: string;
  /** Empty means the repository's default branch. */
  branch: string;
  rootDirectory: string;
}

export interface SiteStarterStatus {
  hasConfig: boolean;
  /** An open starter pull request for this branch, so a reload does not offer a second one. */
  pullRequestUrl: string | null;
}

export interface SiteStarterResult {
  pullRequestUrl: string;
  /** False when an open starter pull request already existed and was returned instead. */
  created: boolean;
}
