import type { StarterSocialPlatform } from "../types/starter";

/** One landing-page fetch; a slow or huge page just means a plainer starter. */
export const STARTER_FETCH_TIMEOUT_MS = 8000;
export const STARTER_FETCH_MAX_BYTES = 2 * 1024 * 1024;
export const STARTER_FETCH_MAX_REDIRECTS = 3;

export const STARTER_MAX_NAV_LINKS = 6;
export const STARTER_MAX_FOOTER_LINKS = 12;
export const STARTER_MAX_LABEL_LENGTH = 40;
/** notra.json caps repository paths and URLs at 300 characters. */
export const STARTER_MAX_URL_LENGTH = 300;

export const STARTER_PULL_REQUEST_TITLE = "Set up Notra Sites";
export const STARTER_BRANCH_PREFIX = "notra/site-starter-";
export const STARTER_COMMIT_HEADLINE = "Add Notra Sites starter files";

export const STARTER_DEFAULT_PRIMARY = "#8B5CF6";
export const STARTER_SAMPLE_POST_PATH = "blog/hello-world.md";

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

/** Elements whose content is not markup; the tokenizer skips straight to their end tag. */
export const STARTER_RAW_TEXT_ELEMENTS: ReadonlySet<string> = new Set([
  "script",
  "style",
  "template",
  "noscript",
  "textarea",
]);

export const STARTER_VOID_ELEMENTS: ReadonlySet<string> = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

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
