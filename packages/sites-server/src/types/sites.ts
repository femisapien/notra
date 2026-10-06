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

export interface SiteNameRejectionParams {
  organizationId: string;
  userId: string;
  name: string;
  /** The site's public hostname, shown to the moderation model. */
  address: string;
  /** Only when the address itself is new (create); renames keep their slug. */
  slug?: string;
}

/** Columns a settings change writes; `undefined` leaves a column as it is. */
export type SiteUpdateValues = Partial<typeof sites.$inferInsert>;

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

export interface RepositorySuggestionsParams {
  organizationId: string;
  repositoryId: string;
  /** The branch whose tree is searched; null for the default branch. */
  ref: string | null;
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
