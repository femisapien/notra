/** A password form is a few hundred bytes; anything bigger is not read. */
export const PASSWORD_FORM_MAX_BYTES = 4096;

/** `?error=` values the dashboard sends visitors back with. */
export const GATE_ERROR_PARAMS = {
  forbidden: "forbidden",
} as const;
