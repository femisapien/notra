/**
 * One `{{ name }}` reference, or an inline code span to skip. Code spans come
 * first so `{{ name }}` inside backticks is matched as part of the span and
 * left alone. `={{ x }}` is a JSX object expression (`style={{ x }}`) and
 * `\{{` is an escaped brace, so neither is a variable.
 */
export const VARIABLE_OR_CODE_SPAN =
  /(?<!`)(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)|(?<![=\\])\{\{\s*([A-Za-z][A-Za-z0-9_-]*)\s*\}\}/g;

/** Opening line of a fenced code block: up to 3 spaces, then 3+ backticks or tildes. */
export const CODE_FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/;
/** Closing line of a fenced code block: the fence characters and nothing else. */
export const CODE_FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;

/** One `{{ name }}` reference; group 1 is the name. */
export const VARIABLE_REFERENCE = /\{\{\s*([A-Za-z][A-Za-z0-9_-]*)\s*\}\}/g;

/** A value YAML reads the same quoted or not, so it can replace a reference in place. */
export const YAML_SAFE_VALUE = /^[^"'\n#:{}[\]&*!|>%@`\\]*$/;
