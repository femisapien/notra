import type { CalloutTone, CalloutVariant } from "../types/builtins";

/** Neutral surface; only the icon carries the tone, like the dashboard Alert. */
export const CALLOUT_TONES: Record<CalloutVariant, CalloutTone> = {
  note: { icon: "info", tone: "var(--muted-foreground)", label: "Note" },
  info: { icon: "info", tone: "var(--info)", label: "Info" },
  tip: { icon: "lightbulb", tone: "var(--success)", label: "Tip" },
  check: { icon: "circle-check", tone: "var(--success)", label: "Done" },
  warning: { icon: "triangle-alert", tone: "var(--warning)", label: "Warning" },
  danger: {
    icon: "octagon-alert",
    tone: "var(--destructive)",
    label: "Danger",
  },
};
