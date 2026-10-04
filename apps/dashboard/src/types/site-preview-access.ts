import type { IconSvgElement } from "@hugeicons/react";

import type { SitePreviewVisibility } from "@/types/sites";

/** Who can open a site's previews, as one choice: visibility plus the optional password. */
export type SitePreviewAccessMode = "members" | "password" | "public";

export interface SitePreviewAccessModeConfig {
  mode: SitePreviewAccessMode;
  visibility: SitePreviewVisibility;
  icon: IconSvgElement;
}
