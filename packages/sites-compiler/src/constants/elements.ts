/**
 * Raw HTML elements content may not use. Inline scripts would slip past
 * script.js and, being part of the page, get hashed into its CSP.
 */
export const BLOCKED_HTML_ELEMENTS: ReadonlySet<string> = new Set(["script"]);

/** Follows `<tag>` in the diagnostic for a blocked element. */
export const BLOCKED_ELEMENT_HINT =
  "is not allowed in content. Put JavaScript in script.js or scripts/*.js.";

/** The name of every opening tag in a chunk of raw HTML. */
export const HTML_OPENING_TAG = /<\s*([a-z][a-z0-9-]*)/gi;
