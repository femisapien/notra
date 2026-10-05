import type { sites } from "@notra/db/schema";
import type { SiteMounts } from "@notra/sites-core/types/deployment";

export type Site = typeof sites.$inferSelect;

/** The form field a rejected create or update belongs to, so the dashboard can point at it. */
export type SiteInputField =
  | "repository"
  | "name"
  | "slug"
  | "rootDirectory"
  | "sections";

/** Why a site name or address is refused, and which of the two to fix. */
export interface SiteNameRejection {
  message: string;
  field: "name" | "slug";
}

export interface CreateSiteInput {
  organizationId: string;
  userId: string;
  projectId?: string | null;
  name: string;
  slug?: string;
  repositoryId: string;
  productionBranch?: string;
  rootDirectory?: string;
  mounts?: SiteMounts;
  previewVisibility?: Site["previewVisibility"];
  publishMode?: Site["publishMode"];
}

export interface DeployBranchHeadOptions {
  trigger: "manual" | "config" | "redeploy";
  userId?: string | null;
  branch?: string;
  previewKey?: string | null;
}

export interface SiteSettingsPatch {
  name?: string;
  productionBranch?: string;
  rootDirectory?: string;
  mounts?: SiteMounts;
  previewsEnabled?: boolean;
  previewVisibility?: Site["previewVisibility"];
  publishMode?: Site["publishMode"];
  showBranding?: boolean;
}

export interface CreateSiteResult {
  site: Site;
  jobId: string | null;
}

export interface BranchPreviewResult {
  jobId: string;
  previewKey: string;
}

export interface UpdateSiteSettingsResult {
  site: Site;
  rebuildJobId: string | null;
  /** Turning previews off closes every open preview. */
  previewRemovalJobIds: string[];
}

export interface SiteCleanupResult {
  deleted: string[];
}
