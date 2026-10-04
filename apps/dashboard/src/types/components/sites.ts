import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";

import type {
  SiteBuildLogFold,
  SiteBuildLogLine,
  SiteChoiceOption,
  SiteDeployment,
  SiteDeploymentRecord,
  SiteDeploymentStatus,
  SiteDeploymentStepState,
  SiteDetail,
  SiteDomain,
  SiteDomainChipStatus,
  SiteDomainRecord,
  SiteEditorDraft,
  SiteListItem,
  SiteMounts,
  SiteNewFileFolder,
  SitePreviewRow,
  SiteRecord,
  SiteScope,
  SiteSection,
} from "@/types/sites";

export interface SitesPageShellProps {
  children: ReactNode;
}

export interface SiteLayoutProps {
  organizationSlug: string;
  siteId: string;
  children: ReactNode;
}

export interface SitesTableProps {
  organizationSlug: string;
  sites: SiteListItem[];
}

export interface SiteCreateFormProps {
  organizationId: string;
  organizationSlug: string;
  hostingDomain: string | null;
}

export interface SiteSectionsFieldsProps {
  idPrefix: string;
  blogEnabled: boolean;
  changelogEnabled: boolean;
  blogPath: string;
  changelogPath: string;
  onBlogEnabledChange: (value: boolean) => void;
  onChangelogEnabledChange: (value: boolean) => void;
  onBlogPathChange: (value: string) => void;
  onChangelogPathChange: (value: string) => void;
  /** Hides the "Sections" heading when a surrounding row already labels the fields. */
  hideTitle?: boolean;
}

export interface SiteSectionRowProps {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  path: string;
  onEnabledChange: (value: boolean) => void;
  onPathChange: (value: string) => void;
}

export interface SiteChoiceGroupProps<T extends string> {
  label: string;
  value: T;
  options: SiteChoiceOption<T>[];
  onValueChange: (value: T) => void;
  disabled?: boolean;
  /** Keeps the label for screen readers only, when a surrounding row already shows it. */
  hideLabel?: boolean;
}

export interface SiteSettingsRowProps {
  label: string;
  /** Id of the control the label belongs to; without it the label is plain text. */
  htmlFor?: string;
  description?: ReactNode;
  children: ReactNode;
}

export interface SiteDeleteDialogProps extends SiteScope {
  organizationSlug: string;
  siteName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface SiteCopyButtonProps {
  value: string;
  /** What is copied, for the accessible name: "Copy {label}". */
  label: string;
  className?: string;
}

export interface SiteMetaProps {
  icon: IconSvgElement;
  children: ReactNode;
  /** For SHAs and branch names. */
  mono?: boolean;
  className?: string;
}

export interface SiteRelativeTimeProps {
  date: Date | string;
  className?: string;
  /** Mid-sentence use: "Live since just now", not "Just now". */
  inline?: boolean;
}

export interface SiteStatusDotProps {
  status: SiteDeploymentStatus;
  /** A ready build that visitors see right now reads "Live". */
  live?: boolean;
  /** Shown muted after the label, e.g. "17s". */
  duration?: string | null;
  className?: string;
}

export interface SitePreviewFrameProps {
  url: string | null;
  className?: string;
  /** Shown instead of "Preview unavailable" when there is no URL, e.g. while the first build runs. */
  fallback?: ReactNode;
}

export interface SiteTopbarTitleProps {
  siteId: string;
  href: string | null;
}

export interface DeploymentTopbarTitleProps {
  siteId: string;
  deploymentId: string;
}

export interface SiteSectionTopbarTitleProps {
  section: SiteSection;
  href: string | null;
}

export interface SiteOverviewInfoRowProps {
  icon: IconSvgElement;
  label: string;
  children: ReactNode;
}

export interface SiteOverviewExternalLinkProps {
  href: string;
  children: ReactNode;
  muted?: boolean;
}

export interface SitePendingProductionProps {
  deployment: SiteDeployment;
}

export interface SiteViewAllLinkProps {
  href: string;
  label: string;
}

export interface SiteUpdatedLineProps {
  deployment: SiteDeployment | null;
}

export interface SiteBuildLogHighlightProps {
  text: string;
  query: string;
}

export interface SiteBuildLogLineTextProps {
  line: SiteBuildLogLine;
  query: string;
}

export interface SiteBuildLogLineProps {
  line: SiteBuildLogLine;
  offset: string | undefined;
  query: string;
}

export interface SiteBuildLogFoldRowProps {
  entry: SiteBuildLogFold;
  offsets: Map<number, string>;
}

export interface SiteBuildLogsProps {
  log: string | null;
  inProgress: boolean;
  /** Still waiting for a builder; the log starts once the sandbox boots. */
  queued: boolean;
  /** Open scrolled to the end, e.g. for a failed build whose error is last. */
  startAtEnd?: boolean;
}

export interface SiteDeploymentMenuProps {
  deployment: Pick<
    SiteDeploymentRecord,
    "id" | "live" | "status" | "url" | "commitSha"
  >;
  canRollback: boolean;
  /** Adds "View details"; for lists. */
  detailHref?: string;
  redeployPending: boolean;
  onRedeploy: () => void;
  onRollback: () => void;
  triggerVariant?: "ghost" | "outline";
  /** Off where a Visit button already sits next to the menu. */
  showVisit?: boolean;
  className?: string;
}

export interface SiteDeploymentUrlValueProps {
  url: string;
  live: boolean;
}

export interface SiteDeploymentPropertiesProps {
  deployment: SiteDeploymentRecord;
  live: boolean;
  urls: string[];
}

export interface SiteDeploymentTimelineProps {
  label: string;
  children: ReactNode;
}

export interface SiteDeploymentTimelineStepProps {
  state: SiteDeploymentStepState;
  label: string;
  /** Muted text after the label, e.g. "Waiting for a builder". */
  note?: ReactNode;
  /** How long the step took, or when it happened. */
  time?: ReactNode;
  last?: boolean;
  collapsible?: { open: boolean; onOpenChange: (open: boolean) => void };
  children?: ReactNode;
}

export interface SiteDeploymentsTableProps {
  organizationId: string;
  organizationSlug: string;
  siteId: string;
  deployments: SiteDeployment[];
  emptyState?: ReactNode;
  /** Row menu with Redeploy and Restore. */
  withActions?: boolean;
  /** Glow rows that arrive after the first render, e.g. a build that just started. */
  highlightNewRows?: boolean;
  emptyHeight?: number;
  /** Grow with the rows and let the page scroll, instead of scrolling inside the table. */
  fitRows?: boolean;
}

export interface SiteDeploymentDetailPageProps {
  deploymentId: string;
}

export interface SiteDeploymentDetailProps extends SiteScope {
  detail: SiteDetail;
  deployment: SiteDeploymentRecord;
  log: string | null;
}

export interface SiteDeploymentMetaProps {
  deployment: SiteDeploymentRecord;
  detail: SiteDetail;
}

export interface SiteDeploymentMetaLinkProps {
  href: string | null;
  title?: string;
  children: ReactNode;
}

/** Parts of the deployment page that only read the deployment (note, failure summary). */
export interface SiteDeploymentRecordProps {
  deployment: SiteDeploymentRecord;
}

export interface SiteLiveSiteProps {
  url: string;
}

export interface SiteRollbackDialogProps extends SiteScope {
  deployment: SiteDeployment | null;
  onOpenChange: (open: boolean) => void;
}

export interface SitePreviewsTableProps extends SiteScope {
  organizationSlug: string;
  rows: SitePreviewRow[];
  repository: SiteRecord["repository"];
  /** Overview variant: fewer columns, no row menu. */
  compact?: boolean;
  emptyState?: ReactNode;
}

export interface SiteOpenPreviewButtonProps {
  label: string;
  tooltip: string;
  disabled: boolean;
  onOpen: () => void;
}

export interface SitePreviewBranchDialogProps extends SiteScope {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface SiteSettingsFormProps extends SiteScope {
  organizationSlug: string;
  detail: SiteDetail;
}

export interface SitePublishDialogProps extends SiteScope {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site: SiteRecord;
  draftCount: number;
  /** Listed in the dialog so it's clear what goes out. */
  drafts: SiteEditorDraft[];
  /** Files on GitHub today; drafts outside it are new files. */
  sourcePaths: ReadonlySet<string>;
  onPublished: () => void;
  onConflict: (paths: string[]) => void;
}

export interface SiteNewFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingPaths: ReadonlySet<string>;
  folders: readonly SiteNewFileFolder[];
  isCreating: boolean;
  onCreate: (path: string, content: string) => void;
}

export interface SiteProxySetupProps {
  aliasOrigin: string;
  mounts: SiteMounts;
  /** Off where a surrounding toggle already names the section. */
  showHeading?: boolean;
}

export interface SiteDnsSetupProps extends SiteScope {
  domain: SiteDomain;
}

export interface SiteDnsRecordValueProps {
  value: string;
  label: string;
}

export interface SiteDnsRecordsTableProps {
  records: SiteDomainRecord[];
}

export interface SiteDnsConnectRowProps {
  providerName: string;
  applyUrl: string;
}

export interface SiteDomainSetupProps extends SiteScope {
  domain: SiteDomain;
  aliasOrigin: string;
  mounts: SiteMounts;
}

export interface SiteDomainStatusDotProps {
  status: SiteDomainChipStatus;
}

export interface SiteDomainCheckButtonProps {
  scope: SiteScope;
  domain: SiteDomain;
}

export interface SiteDomainRowMenuProps {
  hostname: string;
  url: string;
  canOpen: boolean;
  onRemove?: () => void;
}

export interface SiteDomainsTableProps extends SiteScope {
  aliasOrigin: string;
  mounts: SiteMounts;
  domains: SiteDomain[];
  onRemove: (domain: SiteDomain) => void;
}

export interface SiteDomainAddDialogProps extends SiteScope {
  mounts: SiteMounts;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface SiteDomainRemoveDialogProps extends SiteScope {
  domain: SiteDomain | null;
  aliasOrigin: string;
  onOpenChange: (open: boolean) => void;
}

export interface SiteSuggestInputProps {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  suggestions: string[];
  icon: IconSvgElement;
  placeholder?: string;
  /** Shown when the typed text matches no suggestion. */
  emptyLabel: string;
}
