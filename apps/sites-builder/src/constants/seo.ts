/** Meta descriptions are cut around here in search results. */
export const EXCERPT_MAX_LENGTH = 160;

/** Blocks that are not prose: imports, headings, code, JSX, lists, tables, quotes. */
export const NON_PROSE_BLOCK =
  /^(?:import\s|export\s|#|```|~~~|<|\{|[-*+]\s|\d+\.\s|\||>|!\[)/;

/** Theme `--background` in both modes, for `theme-color` when notra.json sets none. */
export const DEFAULT_THEME_COLORS = { light: "#ffffff", dark: "#131316" };

/** Image types iOS accepts for `apple-touch-icon` (it ignores SVG). */
export const TOUCH_ICON_EXTENSIONS = /\.(?:png|jpe?g)$/i;

/** Hostnames whose profile URL names the site's handle for `twitter:site`. */
export const X_HOSTS = new Set([
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
]);

/** Entries listed in an index page's structured data. */
export const STRUCTURED_DATA_LIST_LIMIT = 50;
