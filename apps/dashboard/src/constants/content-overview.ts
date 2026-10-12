export const CONTENT_METADATA_DEBOUNCE_MS = 600;

/** Cover size hosted sites crop to (same as Open Graph images). */
export const CONTENT_COVER_WIDTH = 1200;
export const CONTENT_COVER_HEIGHT = 630;

export const MARKDOWN_IMAGE_URLS =
  /!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;

/** Tag suggestions shown under the tags input. */
export const TAG_SUGGESTION_COUNT = 6;
/** Distinct tags the suggestions endpoint returns, most used first. */
export const TAG_SUGGESTIONS_LIMIT = 50;

/** Link fields on an author, in form order. */
export const CONTENT_AUTHOR_LINK_FIELDS = [
  "url",
  "x",
  "linkedin",
  "github",
] as const;

export const CONTENT_AUTHOR_SLUG_FALLBACK = "author";
/** Retries when another author takes the same slug during ensureSelf. */
export const CONTENT_AUTHOR_ENSURE_SELF_ATTEMPTS = 3;

export const TRAILING_DASHES = /-+$/;
