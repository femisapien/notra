import type { SiteDomain, SiteScope } from "@/types/sites";

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
