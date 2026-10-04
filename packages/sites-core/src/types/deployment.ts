import type {
  siteAreaSchema,
  siteBuildTargetSchema,
  siteHostRecordSchema,
  siteManifestFileSchema,
  siteManifestSchema,
  siteMountsSchema,
  sitePreviewPasswordSchema,
  sitePreviewPointerSchema,
  siteRedirectRuleSchema,
  siteServingPointerSchema,
  siteServingStateSchema,
} from "@notra/sites-core/schemas/deployment";
import type { z } from "zod";

export type SiteArea = z.infer<typeof siteAreaSchema>;
export type SiteMounts = z.infer<typeof siteMountsSchema>;
export type SiteBuildTarget = z.infer<typeof siteBuildTargetSchema>;
export type SiteManifestFile = z.infer<typeof siteManifestFileSchema>;
export type SiteManifest = z.infer<typeof siteManifestSchema>;
export type SiteRedirectRule = z.infer<typeof siteRedirectRuleSchema>;
export type SiteServingState = z.infer<typeof siteServingStateSchema>;
export type SiteServingPointer = z.infer<typeof siteServingPointerSchema>;
export type SitePreviewPointer = z.infer<typeof sitePreviewPointerSchema>;
export type SiteHostRecord = z.infer<typeof siteHostRecordSchema>;

/** One enabled area and the path it is mounted at. */
export interface SiteMountedArea {
  area: SiteArea;
  mount: string;
}

export type SitePreviewPassword = z.infer<typeof sitePreviewPasswordSchema>;
