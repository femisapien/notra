/**
 * Raw HTML elements content may not use. Inline scripts would slip past
 * script.js and, being part of the page, get hashed into its CSP.
 */
export const BLOCKED_HTML_ELEMENTS: ReadonlySet<string> = new Set(["script"]);
