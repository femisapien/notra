import type { LinkIcon } from "./icons";

export interface AiAssistant {
  id: string;
  name: string;
  /** Opens a new chat; the prompt is appended URL-encoded. */
  url: string;
  /** Inline SVG markup. */
  logo: string;
}

/** One entry of the "Open in" menu. */
export interface ContextualMenuItem {
  /** The menu draws a divider wherever the kind changes. */
  kind: "view" | "assistant" | "custom";
  label: string;
  description?: string;
  href: string;
  /** Opens in a new tab with an outbound-link icon. */
  external: boolean;
  /** Inline SVG markup (chat app logos). */
  logo?: string;
  icon?: LinkIcon;
}
