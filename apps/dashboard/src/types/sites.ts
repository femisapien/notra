import type { IconSvgElement } from "@hugeicons/react";
import type {
  SITE_DEPLOYMENT_STATUSES,
  SITE_DOMAIN_STATUSES,
} from "@notra/sites-core/constants/sites";
import type { InferRouterOutputs } from "@orpc/server";
import type { ReactNode } from "react";

import type {
  SITE_DETAIL_TABS,
  SITE_DOMAIN_CONNECT_OUTCOMES,
  SITE_NEW_FILE_FOLDERS,
  SITE_PROXY_RECIPES,
} from "@/constants/sites";
import type { DashboardRouter } from "@/lib/orpc/router";

type SitesOutputs = InferRouterOutputs<DashboardRouter>["sites"];

export type SiteListResult = SitesOutputs["list"];
export type SiteListItem = SiteListResult["sites"][number];
export type SiteDetail = SitesOutputs["get"];
export type SiteRecord = SiteDetail["site"];
export type SiteDeployment = SiteDetail["deployments"][number];
export type SiteDeploymentDetail = SitesOutputs["deployments"]["get"];
export type SiteDeploymentRecord = SiteDeploymentDetail["deployment"];
export type SitePreview = SiteDetail["previews"][number];
export type SiteDomain = SiteDetail["domains"][number];
export type SiteRepository = SitesOutputs["repositories"][number];
export type SiteEditorFiles = SitesOutputs["editor"]["files"];
export type SiteEditorFile = SiteEditorFiles["files"][number];
export type SiteEditorDraft = SiteEditorFiles["drafts"][number];
export type SiteEditorDocument = SitesOutputs["editor"]["read"];
export type SiteDiagnostic = SiteDeploymentRecord["diagnostics"][number];

export type SiteDeploymentStatus = (typeof SITE_DEPLOYMENT_STATUSES)[number];
/** What a badge shows: the build status, or "live" when the serving state points at it. */
export type SiteDomainStatus = (typeof SITE_DOMAIN_STATUSES)[number];
export type SiteDetailTab = (typeof SITE_DETAIL_TABS)[number];
export type SiteSection = SiteDetailTab;

export interface SiteSectionConfig {
  section: SiteSection;
  /** Below `/[slug]/sites/[siteId]`; empty for the overview. */
  path: string;
  icon: IconSvgElement;
}
export type SiteNewFileFolder = (typeof SITE_NEW_FILE_FOLDERS)[number];
export type SiteProxyRecipeId = (typeof SITE_PROXY_RECIPES)[number];
export type SitePreviewVisibility = SiteRecord["previewVisibility"];
export type SitePublishMode = SiteRecord["publishMode"];
export type SiteMounts = SiteRecord["mounts"];
export type SiteDomainKind = SiteDomain["kind"];

/** A GitHub repository as the site links to it. */
export interface SiteRepositoryRef {
  owner: string;
  name: string;
}

export interface SiteProxyRecipe {
  id: SiteProxyRecipeId;
  filename: string;
  code: string;
}

export interface SitesPageClientProps {
  organizationSlug: string;
}

/** `/[slug]/sites` and `/[slug]/sites/new`. */
export interface SitesRoutePageProps {
  params: Promise<{ slug: string }>;
}

/** `/[slug]/sites/[siteId]` layout. */
export interface SiteRouteLayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string; siteId: string }>;
}

/** `/[slug]/sites/[siteId]/deployments/[deploymentId]`. */
export interface SiteDeploymentRoutePageProps {
  params: Promise<{ slug: string; siteId: string; deploymentId: string }>;
}

/** Route context of the Domain Connect callback `/sites/domain-connect/[token]`. */
export interface SiteDomainConnectRouteContext {
  params: Promise<{ token: string }>;
}

export interface SiteScope {
  organizationId: string;
  siteId: string;
}

export interface SiteContextValue {
  organizationId: string;
  organizationSlug: string;
  siteId: string;
  detail: SiteDetail;
  liveDeployment: SiteDeployment | null;
}

export interface SitePreviewRow extends Omit<
  SitePreview,
  "visibility" | "activatedAt"
> {
  visibility: SitePreview["visibility"] | null;
  activatedAt: SitePreview["activatedAt"] | null;
  /** False while the first build runs and nothing is served yet. */
  served: boolean;
  /** "ready" while served, or the status of a newer build that runs or failed. */
  status: SiteDeploymentStatus;
  /** The deployment the row links to: the newest build worth looking at. */
  latestDeploymentId: string;
  updatedAt: Date | string;
}

export interface SiteSettingsForm {
  name: string;
  productionBranch: string;
  rootDirectory: string;
  blogEnabled: boolean;
  blogPath: string;
  changelogEnabled: boolean;
  changelogPath: string;
  previewsEnabled: boolean;
  previewVisibility: SitePreviewVisibility;
  publishMode: SitePublishMode;
  showBranding: boolean;
}

export interface SiteSettingsPatch {
  name?: string;
  productionBranch?: string;
  rootDirectory?: string;
  mounts?: { blog?: string; changelog?: string };
  previewsEnabled?: boolean;
  previewVisibility?: SitePreviewVisibility;
  publishMode?: SitePublishMode;
  showBranding?: boolean;
}

export type SiteDomainRecord = SiteDomain["records"][number];
export type SiteDomainConnectResult = SitesOutputs["domains"]["connect"];
export type SiteDomainConnectOutcome =
  (typeof SITE_DOMAIN_CONNECT_OUTCOMES)[number];
/** What the domain status chip says; `pending` splits by kind. */
export type SiteDomainChipStatus =
  | "active"
  | "dnsRequired"
  | "proxyRequired"
  | "verifying"
  | "failed";

/** A row of the domains table: the Notra address or one custom domain. */
export type SiteDomainRow =
  | { id: string; kind: "alias"; isPrimary: boolean }
  | { id: string; kind: "domain"; domain: SiteDomain };

export interface SiteChoiceOption<T extends string> {
  value: T;
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
}

export type SiteBuildLogTone =
  | "default"
  | "muted"
  | "success"
  | "warning"
  | "error";

/** One line of a build log, split into its own timestamp column when the line has one. */
export interface SiteBuildLogLine {
  number: number;
  timestamp: string | null;
  text: string;
  tone: SiteBuildLogTone;
  /** Indented detail under a warning or error; it takes that line's tone. */
  continued: boolean;
}

/** One fact in a deployment's property list. */
export interface SiteDeploymentPropertyRow {
  key: string;
  label: string;
  value: ReactNode;
}

/** A build log line, or a run of noisy lines folded behind a "show more" row. */
export type SiteBuildLogEntry =
  | { kind: "line"; line: SiteBuildLogLine }
  | {
      kind: "fold";
      id: string;
      lines: SiteBuildLogLine[];
      /** Code frames fold under their warning or error and take its tone. */
      tone: SiteBuildLogTone;
    };

export type SiteBuildLogFold = Extract<SiteBuildLogEntry, { kind: "fold" }>;

/** A build log line split into its tool tag (`[build]`) and the message. */
export interface SiteBuildLogTagParts {
  tag: string | null;
  rest: string;
}

export type SiteDeploymentKind = SiteDeployment["kind"];
export type SiteDeploymentTrigger = SiteDeployment["trigger"];
export type SiteDeploymentStatusFilter =
  | "ready"
  | "building"
  | "queued"
  | "failed"
  | "canceled"
  | "superseded"
  | "expired";

export type SiteDeploymentEnvironmentFilter = SiteDeploymentKind | "all";

/** The deployments page filters by one environment and one status at a time. */
export interface SiteDeploymentFilters {
  environment: SiteDeploymentEnvironmentFilter;
  status: SiteDeploymentStatusFilter | "all";
}

/** A step of a deployment's lifecycle, as the detail page's progress list shows it. */
export type SiteDeploymentStepKey =
  | "queued"
  | "building"
  | "uploading"
  | "ready";
export type SiteDeploymentStepState =
  | "pending"
  | "active"
  | "done"
  | "failed"
  | "skipped";

export interface SiteDeploymentStep {
  key: SiteDeploymentStepKey;
  state: SiteDeploymentStepState;
  /** How long the step took, or has taken so far; null when unknown. */
  durationMs: number | null;
}

/** The deployment fields the lifecycle steps are derived from. */
export type SiteDeploymentStepInput = Pick<
  SiteDeployment,
  "status" | "createdAt" | "startedAt" | "finishedAt" | "buildDurationMs"
>;
