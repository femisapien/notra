"use client";

import {
  ArrowUpRight01Icon,
  Clock01Icon,
  GitBranchIcon,
  GitCommitIcon,
  GitPullRequestIcon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { ORPCError } from "@orpc/client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { buttonVariants } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { InstrumentSection } from "@/components/instrument/instrument-module";
import { useSite } from "@/components/sites/site-context";
import { SiteDeploymentBuildStep } from "@/components/sites/site-deployment-build-step";
import { SiteDeploymentMenu } from "@/components/sites/site-deployment-menu";
import { SiteDeploymentProperties } from "@/components/sites/site-deployment-properties";
import { SiteDeploymentTimeline } from "@/components/sites/site-deployment-timeline";
import { SiteMeta } from "@/components/sites/site-meta";
import { SiteRelativeTime } from "@/components/sites/site-relative-time";
import { SiteRollbackDialog } from "@/components/sites/site-rollback-dialog";
import { SiteStatusDot } from "@/components/sites/site-status-dot";
import { SITE_TRIGGER_ICONS } from "@/constants/sites";
import { useNow } from "@/lib/hooks/use-now";
import {
  useRedeployDeployment,
  useSiteDeployment,
} from "@/lib/hooks/use-site-deployments";
import { useInvalidateSites } from "@/lib/hooks/use-sites";
import type {
  SiteDeploymentActionsProps,
  SiteDeploymentDetailPageProps,
  SiteDeploymentDetailProps,
  SiteDeploymentMetaLinkProps,
  SiteDeploymentMetaProps,
  SiteDeploymentRecordProps,
} from "@/types/components/sites";
import type { SiteDeployment } from "@/types/sites";
import { deploymentSteps } from "@/utils/site-deployment-steps";
import {
  commitTitle,
  deploymentElapsedMs,
  deploymentServedUrls,
  formatBuildDuration,
  isDeploymentInProgress,
  isDeploymentLive,
  isDeploymentProtected,
  shortSha,
} from "@/utils/site-deployments";
import {
  githubCommitUrl,
  githubPullRequestUrl,
  siteHref,
} from "@/utils/site-links";

export function SiteDeploymentDetailPage({
  deploymentId,
}: SiteDeploymentDetailPageProps) {
  const { organizationId, organizationSlug, siteId, detail } = useSite();
  const t = useTranslations("sites.deployment");
  const query = useSiteDeployment({ organizationId, siteId, deploymentId });

  if (!query.data) {
    if (query.error) {
      const notFound =
        query.error instanceof ORPCError && query.error.code === "NOT_FOUND";
      return (
        <EmptyState
          action={
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={siteHref(organizationSlug, siteId, "deployments")}
            >
              {t("back")}
            </Link>
          }
          description={notFound ? t("notFound.description") : t("loadFailed")}
          title={notFound ? t("notFound.title") : t("loadFailedTitle")}
        />
      );
    }
    return <DeploymentDetailSkeleton />;
  }

  return (
    <DeploymentDetail
      deployment={query.data.deployment}
      detail={detail}
      key={deploymentId}
      log={query.data.log}
      organizationId={organizationId}
      siteId={siteId}
    />
  );
}

function DeploymentDetail({
  organizationId,
  siteId,
  detail,
  deployment,
  log,
}: SiteDeploymentDetailProps) {
  const t = useTranslations("sites.deploymentPage");
  const tStatus = useTranslations("sites.status");
  const tLegacy = useTranslations("sites.deployment");
  const invalidateSites = useInvalidateSites();
  const inProgress = isDeploymentInProgress(deployment.status);
  const now = useNow(inProgress);
  const live = isDeploymentLive(deployment, detail);
  const listEntry: SiteDeployment | null =
    detail.deployments.find((entry) => entry.id === deployment.id) ?? null;
  const [rollbackTarget, setRollbackTarget] = useState<SiteDeployment | null>(
    null
  );
  const failed = deployment.status === "failed";
  const [logOpen, setLogOpen] = useState(inProgress || failed);
  const wasInProgress = useRef(inProgress);

  // A build that just finished changes the site too (live pointer, lists).
  useEffect(() => {
    if (wasInProgress.current && !inProgress) {
      invalidateSites();
    }
    wasInProgress.current = inProgress;
  }, [inProgress, invalidateSites]);

  const steps = deploymentSteps(deployment, now);
  const urls = deploymentServedUrls(deployment, detail, live);
  const primaryUrl = urls[0] ?? deployment.url;
  const title = commitTitle(deployment.commitMessage);

  return (
    <div className="space-y-10">
      <span aria-live="polite" className="sr-only">
        {tLegacy("statusAnnouncement", { status: tStatus(deployment.status) })}
      </span>

      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <h1
              className="line-clamp-2 min-w-0 text-2xl font-bold tracking-tight text-balance sm:text-3xl"
              title={title ?? undefined}
            >
              {title ??
                tLegacy("title", { sha: shortSha(deployment.commitSha) })}
            </h1>
            <SiteStatusDot
              duration={
                inProgress
                  ? formatBuildDuration(deploymentElapsedMs(deployment, now))
                  : null
              }
              live={live}
              status={deployment.status}
            />
          </div>
          <DeploymentMeta deployment={deployment} detail={detail} />
          <DeploymentNote deployment={deployment} />
        </div>
        <DeploymentActions
          deployment={deployment}
          live={live}
          onRollback={() => setRollbackTarget(listEntry)}
          organizationId={organizationId}
          primaryUrl={primaryUrl}
          rollbackEntry={listEntry}
          siteId={siteId}
        />
      </header>

      <InstrumentSection eyebrow={t("sections.build")}>
        <SiteDeploymentTimeline label={t("steps.label")}>
          {steps.map((step, index) => (
            <SiteDeploymentBuildStep
              deployment={deployment}
              key={step.key}
              last={index === steps.length - 1}
              live={live}
              liveUrl={
                live && !isDeploymentProtected(deployment, detail)
                  ? primaryUrl
                  : null
              }
              log={log}
              logOpen={logOpen}
              onLogOpenChange={setLogOpen}
              step={step}
            />
          ))}
        </SiteDeploymentTimeline>
      </InstrumentSection>

      <InstrumentSection eyebrow={t("sections.details")}>
        <SiteDeploymentProperties
          deployment={deployment}
          live={live}
          urls={urls}
        />
      </InstrumentSection>

      <SiteRollbackDialog
        deployment={rollbackTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRollbackTarget(null);
          }
        }}
        organizationId={organizationId}
        siteId={siteId}
      />
    </div>
  );
}

/** Visit for a live build, then the deployment menu once the build is over. */
function DeploymentActions({
  organizationId,
  siteId,
  deployment,
  live,
  primaryUrl,
  rollbackEntry,
  onRollback,
}: SiteDeploymentActionsProps) {
  const t = useTranslations("sites.deploymentPage");
  const redeploy = useRedeployDeployment({ organizationId, siteId });
  const inProgress = isDeploymentInProgress(deployment.status);
  return (
    <div className="flex shrink-0 items-center gap-2">
      {live ? (
        <a
          className={buttonVariants()}
          href={primaryUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          {t("visit")}
          <HugeiconsIcon
            data-icon="inline-end"
            icon={ArrowUpRight01Icon}
            strokeWidth={1.5}
          />
        </a>
      ) : null}
      {inProgress ? null : (
        <SiteDeploymentMenu
          canRollback={rollbackEntry?.canRollback ?? false}
          className="size-9"
          deployment={{ ...deployment, live, url: primaryUrl }}
          onRedeploy={() => redeploy.mutate(deployment.id)}
          onRollback={onRollback}
          redeployPending={redeploy.isPending}
          showVisit={false}
          triggerVariant="outline"
        />
      )}
    </div>
  );
}

/** Branch, commit, pull request, who started it and when: one line with icons. */
function DeploymentMeta({ deployment, detail }: SiteDeploymentMetaProps) {
  const t = useTranslations("sites.deploymentPage");
  const repository = detail.site.repository;
  const commitUrl = githubCommitUrl(repository, deployment.commitSha);
  const prUrl = githubPullRequestUrl(repository, deployment.pullRequestNumber);
  const branchUrl = repository
    ? `https://github.com/${repository.owner}/${repository.name}/tree/${deployment.branch}`
    : null;
  const byline = deployment.commitAuthor
    ? t(`byline.${deployment.trigger}`, { author: deployment.commitAuthor })
    : t(`bylineAnonymous.${deployment.trigger}`);

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5">
      <MetaLink href={branchUrl} title={deployment.branch}>
        <SiteMeta className="max-w-64" icon={GitBranchIcon} mono>
          {deployment.branch}
        </SiteMeta>
      </MetaLink>
      <MetaLink href={commitUrl}>
        <SiteMeta icon={GitCommitIcon} mono>
          {shortSha(deployment.commitSha)}
        </SiteMeta>
      </MetaLink>
      {deployment.pullRequestNumber ? (
        <MetaLink href={prUrl}>
          <SiteMeta icon={GitPullRequestIcon}>
            {t("pullRequest", { number: deployment.pullRequestNumber })}
          </SiteMeta>
        </MetaLink>
      ) : null}
      <SiteMeta icon={SITE_TRIGGER_ICONS[deployment.trigger]}>
        {byline}
      </SiteMeta>
      <SiteMeta icon={Clock01Icon}>
        <SiteRelativeTime date={deployment.createdAt} />
      </SiteMeta>
    </div>
  );
}

function MetaLink({ href, title, children }: SiteDeploymentMetaLinkProps) {
  if (!href) {
    return (
      <span className="min-w-0" title={title}>
        {children}
      </span>
    );
  }
  return (
    <a
      className="hover:[&_span]:text-foreground min-w-0 [&_span]:transition-colors [&_span]:duration-150"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
      title={title}
    >
      {children}
    </a>
  );
}

/** Why a deployment stopped short, in one quiet line. */
function DeploymentNote({ deployment }: SiteDeploymentRecordProps) {
  const t = useTranslations("sites.deploymentPage.notice");
  if (
    deployment.status !== "canceled" &&
    deployment.status !== "superseded" &&
    deployment.status !== "expired"
  ) {
    return null;
  }
  return (
    <p
      className="text-muted-foreground flex items-start gap-1.5 text-sm text-pretty"
      role="status"
    >
      <HugeiconsIcon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0"
        icon={InformationCircleIcon}
        strokeWidth={1.5}
      />
      {t(deployment.status)}
    </p>
  );
}

function DeploymentDetailSkeleton() {
  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-4 w-16" />
        {["queued", "building", "publishing", "live"].map((key) => (
          <div className="flex items-center gap-3" key={key}>
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}
