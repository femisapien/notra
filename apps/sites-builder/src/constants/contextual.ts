/** Custom actions may only leave for the web or mail; `javascript:` and friends are dropped. */
export const SAFE_CUSTOM_HREF = /^(?:https?:\/\/|\/(?!\/)|mailto:)/i;

export const EXTERNAL_HREF = /^https?:\/\//i;

/** `{url}` / `{markdownUrl}` in a custom action's href. */
export const CONTEXTUAL_PLACEHOLDER = /\{(url|markdownUrl)\}/g;
