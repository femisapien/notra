import type { StarterSocialPlatform } from "../types/starter";

/** One landing-page fetch; a slow or huge page just means a plainer starter. */
export const STARTER_FETCH_TIMEOUT_MS = 8000;
export const STARTER_FETCH_MAX_BYTES = 2 * 1024 * 1024;
export const STARTER_FETCH_MAX_REDIRECTS = 3;

export const STARTER_MAX_NAV_LINKS = 6;
export const STARTER_MAX_FOOTER_LINKS = 12;
export const STARTER_MAX_LABEL_LENGTH = 40;
export const STARTER_NAME_MAX_LENGTH = 80;
export const STARTER_DESCRIPTION_MAX_LENGTH = 300;
export const STARTER_FOOTER_DESCRIPTION_MAX_LENGTH = 160;
/** notra.json caps repository paths and URLs at 300 characters. */
export const STARTER_MAX_URL_LENGTH = 300;

export const STARTER_USER_AGENT =
  "NotraSites-Starter/1.0 (+https://usenotra.com)";

export const STARTER_PULL_REQUEST_TITLE = "Set up Notra Sites";
export const STARTER_BRANCH_PREFIX = "notra/site-starter-";
export const STARTER_COMMIT_HEADLINE = "Add Notra Sites starter files";

export const STARTER_SAMPLE_POST_PATH = "blog/hello-world.md";

/** Letters, digits and plain punctuation stay readable in MDX; everything else becomes a character reference. */
export const STARTER_MDX_SAFE_CHAR = /[\p{L}\p{N} .,:;!?()/'’-]/u;
export const STARTER_LINK_CLASS =
  "text-muted-foreground transition-colors hover:text-foreground";

/** Labels that make a link the header's call to action instead of a plain link. */
export const STARTER_CTA_LABEL =
  /^(?:get started|start(?: for)? free|sign ?up|try(?: it)?(?: for)? free|try \w+|book a demo|request(?: a)? demo|start now|join)/i;

/** Hosts whose links are social profiles, not footer links. */
export const STARTER_SOCIAL_HOSTS: ReadonlyArray<
  readonly [string, StarterSocialPlatform]
> = [
  ["x.com", "x"],
  ["twitter.com", "x"],
  ["github.com", "github"],
  ["linkedin.com", "linkedin"],
  ["youtube.com", "youtube"],
  ["discord.gg", "discord"],
  ["discord.com", "discord"],
  ["instagram.com", "instagram"],
  ["facebook.com", "facebook"],
  ["bsky.app", "bluesky"],
  ["threads.net", "threads"],
  ["reddit.com", "reddit"],
  ["medium.com", "medium"],
  ["t.me", "telegram"],
];

/** System font names a brand profile may list that Google Fonts cannot serve. */
export const STARTER_SYSTEM_FONTS: ReadonlySet<string> = new Set([
  "arial",
  "helvetica",
  "helvetica neue",
  "system-ui",
  "sans-serif",
  "serif",
  "monospace",
  "-apple-system",
  "sf pro",
  "sf pro display",
  "sf pro text",
  "segoe ui",
  "times new roman",
  "georgia",
  "inherit",
]);
