import {
  SITE_DEPLOYMENT_ENVIRONMENT_FILTERS,
  SITE_DEPLOYMENT_IN_PROGRESS_STATUSES,
  SITE_DEPLOYMENT_STATUS_FILTERS,
  SITE_SHORT_SHA_LENGTH,
} from "@/constants/sites";
import type {
  SiteDeployment,
  SiteDeploymentEnvironmentFilter,
  SiteDeploymentFilters,
  SiteDeploymentRecord,
  SiteDeploymentStatus,
  SiteDeploymentStatusFilter,
  SiteDetail,
} from "@/types/sites";
import { hostFromOrigin } from "@/utils/site-links";

const MS_PER_SECOND = 1000;

const ESCAPE = String.fromCharCode(27);
/** Terminal color and cursor sequences the build tools print into the log. */
const ANSI_SEQUENCE = new RegExp(`${ESCAPE}\\[[0-9;?]*[A-Za-z]`, "g");

const SECONDS_PER_MINUTE = 60;

export function isDeploymentInProgress(status: SiteDeploymentStatus): boolean {
  return SITE_DEPLOYMENT_IN_PROGRESS_STATUSES.has(status);
}

export function hasDeploymentInProgress(
  deployments: readonly Pick<SiteDeployment, "status">[]
): boolean {
  return deployments.some((deployment) =>
    isDeploymentInProgress(deployment.status)
  );
}

export function stripAnsi(text: string): string {
  return text.replace(ANSI_SEQUENCE, "");
}

export function shortSha(sha: string): string {
  return sha.slice(0, SITE_SHORT_SHA_LENGTH);
}

/** First line of a commit message; GitHub shows the same as the title. */
export function commitTitle(message: string | null): string | null {
  const title = message?.split("\n", 1)[0]?.trim();
  return title ? title : null;
}

export function formatBuildDuration(ms: number | null): string | null {
  if (ms === null || ms < 0) {
    return null;
  }
  const totalSeconds = Math.max(1, Math.round(ms / MS_PER_SECOND));
  if (totalSeconds < SECONDS_PER_MINUTE) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

/** Wall time of a deployment from when work started until it finished (or now). */
export function deploymentElapsedMs(
  deployment: Pick<
    SiteDeployment,
    "buildDurationMs" | "startedAt" | "finishedAt" | "createdAt"
  >,
  now = Date.now()
): number | null {
  if (deployment.buildDurationMs !== null) {
    return deployment.buildDurationMs;
  }
  const start = deployment.startedAt ?? deployment.createdAt;
  const end = deployment.finishedAt ? deployment.finishedAt.getTime() : now;
  return end - new Date(start).getTime();
}

/** Whether visitors see this deployment right now, from the site's serving state. */
export function isDeploymentLive(
  deployment: SiteDeploymentRecord,
  detail: SiteDetail
): boolean {
  if (deployment.kind === "production") {
    return detail.site.liveDeploymentId === deployment.id;
  }
  return detail.previews.some(
    (preview) => preview.deploymentId === deployment.id
  );
}

/** Every URL a live deployment answers on; the first is the primary one. */
export function deploymentServedUrls(
  deployment: SiteDeploymentRecord,
  detail: SiteDetail,
  live: boolean
): string[] {
  if (!(live && deployment.kind === "production")) {
    return [deployment.url];
  }
  const urls = [detail.site.liveUrl];
  const hosts = new Set([hostFromOrigin(detail.site.liveUrl)]);
  const candidates = [
    ...detail.domains
      .filter((domain) => domain.status === "active")
      .map((domain) => `https://${domain.hostname}`),
    detail.site.aliasOrigin,
  ];
  for (const url of candidates) {
    const host = hostFromOrigin(url);
    if (!hosts.has(host)) {
      hosts.add(host);
      urls.push(url);
    }
  }
  return urls;
}

function deploymentMatchesStatus(
  deployment: SiteDeployment,
  filter: SiteDeploymentStatusFilter | "all"
): boolean {
  if (filter === "all") {
    return true;
  }
  // Uploading takes a second; it reads as part of the build.
  if (filter === "building") {
    return (
      deployment.status === "building" || deployment.status === "uploading"
    );
  }
  return deployment.status === filter;
}

export function deploymentMatchesFilters(
  deployment: SiteDeployment,
  filters: SiteDeploymentFilters
): boolean {
  const environmentOk =
    filters.environment === "all" || filters.environment === deployment.kind;
  return environmentOk && deploymentMatchesStatus(deployment, filters.status);
}

export function isDeploymentEnvironmentFilter(
  value: string | null
): value is SiteDeploymentEnvironmentFilter {
  return SITE_DEPLOYMENT_ENVIRONMENT_FILTERS.some((option) => option === value);
}

export function isDeploymentStatusFilter(
  value: string | null
): value is SiteDeploymentStatusFilter | "all" {
  return SITE_DEPLOYMENT_STATUS_FILTERS.some((option) => option === value);
}
