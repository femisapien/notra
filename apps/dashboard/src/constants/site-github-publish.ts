import type { GitHubPublishContentType } from "@/types/integrations/github";

/** Notra Sites only builds entries from these folders under the root directory. */
export const SITE_ENTRY_DIRECTORIES = {
  blog_post: "blog",
  changelog: "changelog",
} as const satisfies Record<GitHubPublishContentType, string>;

/** Files here are served from the site root (`public/images/x.png` → `/images/x.png`). */
export const SITE_PUBLIC_DIRECTORY = "public";
export const SITE_IMAGE_DIRECTORY = "images";

/** Search snippets cut off around here; longer descriptions only get truncated. */
export const SITE_ENTRY_DESCRIPTION_MAX_LENGTH = 160;

/** Last resort when neither slug, title nor id yields a valid file name. */
export const SITE_ENTRY_FALLBACK_SLUG = "post";
