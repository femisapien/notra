/** Banner fills by `type`, light and dark; text on them is white. */
export const BANNER_COLORS = {
  info: { light: "var(--primary-button)", dark: "var(--primary-button)" },
  warning: { light: "oklch(0.52 0.12 60)", dark: "oklch(0.47 0.11 60)" },
  critical: { light: "oklch(0.53 0.2 27)", dark: "oklch(0.48 0.18 27)" },
} as const;

/** localStorage key prefix; the content hash follows, so a new message shows again. */
export const BANNER_DISMISS_KEY = "notra-banner:";
