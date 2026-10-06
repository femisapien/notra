import {
  SITE_CUSTOM_SCRIPT_FILENAME,
  SITE_CUSTOM_SCRIPTS_DIR,
  SITE_SOURCE_ROOT_ENTRIES,
} from "@notra/sites-core/constants/sites";

/**
 * Plain browser JavaScript, loaded on every page: `script.js`, `.js` files
 * below `scripts/`, and `.js` files outside the content folders (for example
 * `analytics.js` at the root). In `snippets/`, `blog/` and the other content
 * folders a `.js` file stays an importable component.
 */
export function isCustomScriptPath(path: string): boolean {
  if (!/\.js$/i.test(path)) {
    return false;
  }
  const root = path.split("/")[0] ?? "";
  return (
    path === SITE_CUSTOM_SCRIPT_FILENAME ||
    root === SITE_CUSTOM_SCRIPTS_DIR ||
    !(SITE_SOURCE_ROOT_ENTRIES as readonly string[]).includes(root)
  );
}

/** Custom scripts in page order: `script.js` first, then the rest by path. */
export function sortCustomScriptPaths(paths: Iterable<string>): string[] {
  return [...paths].filter(isCustomScriptPath).sort((a, b) => {
    if (a === SITE_CUSTOM_SCRIPT_FILENAME) {
      return -1;
    }
    if (b === SITE_CUSTOM_SCRIPT_FILENAME) {
      return 1;
    }
    // Code-point order, so the result never depends on the build machine's locale.
    if (a < b) {
      return -1;
    }
    return a > b ? 1 : 0;
  });
}
