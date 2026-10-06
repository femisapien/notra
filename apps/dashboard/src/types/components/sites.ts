import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";

import type { SiteIntegrationProvider } from "@/types/site-integrations";
import type {
  RepositorySuggestionsResult,
  SiteBuildLogEntry,
  SiteBuildLogFold,
  SiteBuildLogLine,
  SiteChoiceOption,
  SiteCreateFieldErrors,
  SiteCreateFormValues,
  SiteCreateSectionPlan,
  SiteCreateStepId,
  SiteDeployment,
  SiteDeploymentRecord,
  SiteDeploymentStatus,
  SiteDetail,
  SiteDomain,
  SiteDomainChipStatus,
  SiteDomainRecord,
  SiteImportableRepository,
  SiteEditorDraft,
  SiteListItem,
  SiteMounts,
  SiteNewFileFolder,
  SitePreviewRow,
  SitePreviewVisibility,
  SitePublishMode,
  SiteRecord,
  SiteRepository,
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

export interface SiteCreateSourceFieldsProps {
  idPrefix: string;
  organizationId: string;
  hostingDomain: string | null;
  form: SiteCreateFormValues;
  onChange: <K extends keyof SiteCreateFormValues>(
    key: K,
    value: SiteCreateFormValues[K]
  ) => void;
  /** The picked repository; null until one is. */
  repository: SiteRepository | null;
  slugInvalid: boolean;
  /** Messages from a rejected create call, shown under their fields. */
  errors: SiteCreateFieldErrors;
  starterPullRequestUrl: string | null;
  onStarterPullRequestOpened: (url: string) => void;
  suggestions: RepositorySuggestionsResult;
  sections: SiteCreateSectionPlan;
}

export interface SiteCreateSectionFieldsProps {
  idPrefix: string;
  plan: SiteCreateSectionPlan;
  onBlogPathChange: (value: string) => void;
  onChangelogPathChange: (value: string) => void;
  /** A rejected create call's message about the sections. */
  error?: string;
}

export interface SiteAddressInputProps {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  invalid: boolean;
  placeholder: string;
  /** Shown after the input, e.g. `notra.site`; hidden when unknown. */
  hostingDomain: string | null;
  describedBy?: string;
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

export interface SiteOverviewStatusProps {
  /** A production build running now or failed after the live one. */
  pendingProduction: SiteDeployment | null;
  suspended: boolean;
  /** A deployment is live. */
  live: boolean;
}

export interface SiteOverviewPreviewProps {
  /** The live site; null when it's offline or nothing is live. */
  url: string | null;
  suspended: boolean;
  /** The very first build is still running. */
  firstBuild: boolean;
  live: boolean;
}

export interface SiteOverviewDomainsProps {
  /** Custom domains, primary first. */
  domains: SiteDomain[];
  /** The site on its Notra address. */
  aliasUrl: string;
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

export interface SiteBuildLogRowsProps {
  entries: SiteBuildLogEntry[];
  /** Lines matching `query`; unused without one. */
  matchingLines: SiteBuildLogLine[];
  offsets: Map<number, string>;
  /** The trimmed filter text; empty shows every entry. */
  query: string;
}

export interface SiteBuildLogFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export interface SiteBuildLogSummaryProps {
  lines: SiteBuildLogLine[];
  inProgress: boolean;
}

export interface SiteBuildLogEmptyProps {
  inProgress: boolean;
  queued: boolean;
}

export interface SiteBuildLogCopyButtonProps {
  log: string | null;
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
  /** Rows per page; the table grows with the page and pages below it. */
  pageSize: number;
}

export interface SiteDeploymentDetailPageProps {
  deploymentId: string;
}

export interface SiteDeploymentDetailProps extends SiteScope {
  detail: SiteDetail;
  deployment: SiteDeploymentRecord;
  log: string | null;
}

export interface SiteDeploymentActionsProps extends SiteScope {
  deployment: SiteDeploymentRecord;
  live: boolean;
  primaryUrl: string;
  /** The deployment's list entry, which knows whether it can be restored. */
  rollbackEntry: SiteDeployment | null;
  onRollback: () => void;
}

/** Parts of the deployment page that only read the deployment (note, failure summary). */
export interface SiteEnvironmentBadgeProps {
  kind: SiteDeployment["kind"];
  previewKey: string | null;
  live: boolean;
  className?: string;
}

export interface SiteDeploymentSummaryProps {
  detail: SiteDetail;
  deployment: SiteDeploymentRecord;
  live: boolean;
  urls: string[];
  primaryUrl: string;
}

export interface SiteDeploymentFactProps {
  label: string;
  children: ReactNode;
}

export interface SiteDeploymentExternalLinkProps {
  href: string | null;
  children: ReactNode;
  mono?: boolean;
}

export interface SiteDeploymentRecordProps {
  deployment: SiteDeploymentRecord;
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

export interface SitePreviewRowMenuProps {
  row: SitePreviewRow;
  onCopyShareLink: () => void;
  onViewDeployment: () => void;
  onDelete: () => void;
}

export interface SitePreviewDeleteDialogProps extends SiteScope {
  /** The preview to delete; null keeps the dialog closed. */
  preview: SitePreviewRow | null;
  onOpenChange: (open: boolean) => void;
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

export interface SiteSettingsDangerZoneProps extends SiteScope {
  organizationSlug: string;
  site: SiteRecord;
}

export interface SiteSettingsSaveBarProps {
  /** The changed settings are complete enough to save. */
  canSave: boolean;
  isSaving: boolean;
  onReset: () => void;
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

export interface SiteNewFileFolderTabsProps {
  folders: readonly SiteNewFileFolder[];
  value: SiteNewFileFolder;
  onValueChange: (folder: SiteNewFileFolder) => void;
}

export interface SiteNewFileNameFieldProps {
  /** Prefix for the input and hint ids. */
  id: string;
  folder: SiteNewFileFolder;
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  /** The typed name, or the one derived from the title. */
  slug: string;
  slugValid: boolean;
  /** A file already lives at `path`. */
  exists: boolean;
  path: string;
}

export interface SiteProxySetupProps {
  aliasOrigin: string;
  mounts: SiteMounts;
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

export interface SiteDomainSetupStepProps {
  number: number;
  /** The last step draws no line to a next one. */
  isLast?: boolean;
  children: ReactNode;
}

export interface SiteDnsProviderButtonProps {
  providerName: string;
  href: string;
  /** Domain Connect: applies the records at the provider, then comes back. */
  oneClick?: boolean;
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
  invalid?: boolean;
  describedBy?: string;
}

export interface SiteIntegrationLogoProps {
  provider: SiteIntegrationProvider;
  className?: string;
}

export interface SiteIntegrationRowProps {
  provider: SiteIntegrationProvider;
  /** The site already has this provider in notra.json. */
  isSetUp: boolean;
  onOpen: () => void;
  onRemove: () => void;
}

export interface SiteIntegrationDialogProps {
  scope: SiteScope;
  provider: SiteIntegrationProvider;
  settings: Record<string, unknown> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface SiteImportListProps {
  organizationId: string;
  organizationSlug: string;
  repositories: SiteImportableRepository[];
  /** The GitHub App is installed for the organization. */
  installed: boolean;
  isLoading: boolean;
  /** GitHub id of the repository being connected right now. */
  importingId: string | null;
  onImport: (repository: SiteImportableRepository) => void;
}

export type SiteCreateStepState = "active" | "done" | "locked";

export interface SiteCreateStepProps {
  title: string;
  description?: string;
  state: SiteCreateStepState;
  /** The action band under the card. */
  footer?: ReactNode;
  /** Makes a done step the active one again. */
  onActivate?: () => void;
  children: ReactNode;
}

export interface SiteCreateStepListProps {
  steps: { id: SiteCreateStepId; label: string; state: SiteCreateStepState }[];
  onSelect: (id: SiteCreateStepId) => void;
}

export interface SiteCreateStageProps {
  /** Index of the card to centre. */
  activeIndex: number;
  /** Beside the active card on the left: its title and description. */
  left: ReactNode;
  /** Beside the active card on the right: the step list. */
  right: ReactNode;
  children: ReactNode;
}

export interface SiteCreateDeployProps {
  organizationId: string;
  organizationSlug: string;
  /** The site the create call returned. */
  site: { id: string; liveUrl: string };
  /** False when creating the site couldn't start its first build. */
  deploymentQueued: boolean;
  /** A starter pull request opened before creating the site; a missing notra.json points there. */
  starterPullRequestUrl?: string | null;
}

export interface SiteCreateStarterProps {
  organizationId: string;
  repositoryId: string;
  /** As typed; empty means the default branch. */
  branch: string;
  rootDirectory: string;
  /** The starter pull request opened from this page, if any. */
  pullRequestUrl: string | null;
  onPullRequestOpened: (url: string) => void;
}

export interface SiteRootDirectoryToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}
