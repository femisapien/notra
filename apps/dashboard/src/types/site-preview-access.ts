import type { IconSvgElement } from "@hugeicons/react";

import type { SitePreviewVisibility } from "@/types/sites";

/** Who can open a site's previews, as one choice: visibility plus the optional password. */
export type SitePreviewAccessMode = "members" | "password" | "public";

export interface SitePreviewAccessModeConfig {
  mode: SitePreviewAccessMode;
  visibility: SitePreviewVisibility;
  icon: IconSvgElement;
}

/** The preview access form as the user left it. */
export interface SitePreviewAccessDraft {
  enabled: boolean;
  mode: SitePreviewAccessMode;
  password: string;
  /** Typing a new password, rather than keeping the one that is set. */
  editingPassword: boolean;
}

/** What saving the preview access form would change. */
export interface SitePreviewAccessPlan {
  previewsEnabled: boolean;
  previewVisibility: SitePreviewVisibility;
  /** Previews on/off or their visibility differ from the saved settings. */
  settingsChanged: boolean;
  /** A new password to set, null to remove the current one, undefined to leave it. */
  password: string | null | undefined;
  passwordTooShort: boolean;
  isDirty: boolean;
}
