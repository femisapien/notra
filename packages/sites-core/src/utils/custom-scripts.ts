import {
  SITE_CUSTOM_SCRIPT_FILENAME,
  SITE_CUSTOM_SCRIPTS_DIR,
} from "@notra/sites-core/constants/sites";

/** `script.js` or a `.js` file anywhere below `scripts/`: plain browser JavaScript, not a component. */
export function isCustomScriptPath(path: string): boolean {
  return (
    path === SITE_CUSTOM_SCRIPT_FILENAME ||
    (path.startsWith(`${SITE_CUSTOM_SCRIPTS_DIR}/`) && /\.js$/i.test(path))
  );
}

/** Custom scripts in page order: `script.js` first, then `scripts/` by path. */
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
