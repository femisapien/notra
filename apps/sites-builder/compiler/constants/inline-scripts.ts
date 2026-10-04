/**
 * Every `<script>` element with its attributes and body. Browsers end a script
 * at `</script` followed by anything up to `>` (`</script foo>` too), so the
 * end tag allows the same.
 */
export const SCRIPT_ELEMENT = /<script\b([^>]*)>([\s\S]*?)<\/script\b[^>]*>/gi;
export const SRC_ATTRIBUTE = /(?:^|\s)src\s*=/i;
export const TYPE_ATTRIBUTE =
  /(?:^|\s)type\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;
/** `type` values a browser executes; anything else (JSON-LD, templates) is data and needs no hash. */
export const EXECUTABLE_SCRIPT_TYPES = new Set([
  "",
  "module",
  "text/javascript",
  "application/javascript",
]);
