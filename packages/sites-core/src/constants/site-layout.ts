/** Navbar links that bring their own icon and default label. */
export const SITE_NAVBAR_LINK_TYPES = [
  "github",
  "discord",
  "x",
  "linkedin",
  "youtube",
  "slack",
] as const;

/** `footer.socials` keys; each renders as its platform icon. */
export const SITE_SOCIAL_PLATFORMS = [
  "x",
  "github",
  "linkedin",
  "youtube",
  "discord",
  "slack",
  "instagram",
  "facebook",
  "bluesky",
  "threads",
  "reddit",
  "medium",
  "telegram",
  "hacker-news",
  "website",
] as const;

/** Built-in post actions for `contextual.options`. */
export const SITE_CONTEXTUAL_OPTIONS = [
  "copy",
  "view",
  "chatgpt",
  "claude",
  "t3chat",
  "perplexity",
  "grok",
] as const;

/**
 * Optional MDX files at the site root that replace the theme's own chrome or
 * fill fixed places on its pages. Compiled like posts; nothing is executed.
 */
export const SITE_CHROME_FILES = ["header.mdx", "footer.mdx"] as const;
export const SITE_SLOTS_DIR = "slots";
export const SITE_SLOT_NAMES = [
  "blog-hero",
  "changelog-hero",
  "before-post",
  "after-post",
  "sidebar",
  "after-changelog-entry",
] as const;
