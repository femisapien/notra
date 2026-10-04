import type { SiteDiagnostic, SiteDomain, SiteScope } from "@/types/sites";

/** What a site query's `refetchInterval` callback reads to decide how fast to poll. */
export interface SitePollingQuery<TData> {
  state: { data?: TData };
}

export interface UseSiteDeploymentParams extends SiteScope {
  deploymentId: string;
}

export interface UseSiteDomainCheckParams extends SiteScope {
  domainId: string;
}

export interface UseSiteDomainConnectParams extends SiteScope {
  domain: SiteDomain;
}

export interface UseRebaseSiteDraftsParams extends SiteScope {
  /** Runs before the drafts refetch, so the open file reloads with them. */
  onRebased: () => void;
}

export interface UseValidateSiteDraftsParams extends SiteScope {
  onValidated: (diagnostics: SiteDiagnostic[]) => void;
}

export interface UseCreateSiteFileParams extends SiteScope {
  /** The commit the file list was read at; null before it loads. */
  baseCommitSha: string | null;
  refreshDrafts: () => Promise<void>;
  /** The draft is stored; the file list hasn't caught up yet. */
  onSaved: () => void;
  /** The file list has the new file; open it. */
  onCreated: (path: string) => void;
}

export interface UseSavePreviewAccessParams extends SiteScope {
  /** Runs after saving, before the site refetches. */
  onSaved: () => void;
}
