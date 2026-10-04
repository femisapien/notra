import { SITE_PREVIEW_ACCESS_MODES } from "@/constants/site-preview-access";
import type {
  SitePreviewAccessMode,
  SitePreviewAccessModeConfig,
} from "@/types/site-preview-access";
import type { SiteRecord } from "@/types/sites";

export function sitePreviewAccessMode(
  site: Pick<SiteRecord, "previewVisibility" | "previewPasswordSetAt">
): SitePreviewAccessMode {
  if (site.previewVisibility === "public") {
    return "public";
  }
  return site.previewPasswordSetAt ? "password" : "members";
}

export function sitePreviewAccessModeConfig(
  mode: SitePreviewAccessMode
): SitePreviewAccessModeConfig {
  const config = SITE_PREVIEW_ACCESS_MODES.find(
    (candidate) => candidate.mode === mode
  );
  if (!config) {
    throw new Error(`Unknown preview access mode: ${mode}`);
  }
  return config;
}
