import { SITE_SOURCE_ROOT_ENTRIES } from "../constants/sites";
import { isCustomScriptPath } from "./custom-scripts";

const CONTENT_ROOTS = new Set<string>(SITE_SOURCE_ROOT_ENTRIES);
const STYLESHEET_EXTENSION = ".css";

/** The known top-level entry a path belongs to (`blog`, `snippets`, `style.css`, …), if any. */
export function isSiteContentPath(path: string): boolean {
  return CONTENT_ROOTS.has(path.split("/")[0] ?? "");
}

/** A stylesheet the site loads on every page, after the theme, wherever it sits. */
export function isSiteStylesheet(path: string): boolean {
  return path.toLowerCase().endsWith(STYLESHEET_EXTENSION);
}

/**
 * Whether a file belongs to the site's source: everything in the known
 * entries, plus stylesheets and plain scripts anywhere, so a repo that
 * already keeps `buttons.css` or `analytics.js` next to its pages works as
 * it is.
 */
export function isSiteSourcePath(path: string): boolean {
  return (
    isSiteContentPath(path) ||
    isSiteStylesheet(path) ||
    isCustomScriptPath(path)
  );
}
