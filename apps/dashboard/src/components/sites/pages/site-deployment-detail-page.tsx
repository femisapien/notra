"use client";

import {
  ArrowUpRight01Icon,
  CancelCircleIcon,
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
import { SiteBuildLogs } from "@/components/sites/site-build-logs";
import { useSite } from "@/components/sites/site-context";
import { SiteDeploymentMenu } from "@/components/sites/site-deployment-menu";
import { SiteDeploymentProperties } from "@/components/sites/site-deployment-properties";
import {
  SiteDeploymentTimeline,
  SiteDeploymentTimelineStep,
} from "@/components/sites/site-deployment-timeline";
import { SiteMeta } from "@/components/sites/site-meta";
import { SitePreviewFrame } from "@/components/sites/site-preview-frame";
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
import { cn } from "@/lib/utils";
import type {
  SiteDeploymentDetailPageProps,
  SiteDeploymentDetailProps,
  SiteDeploymentMetaLinkProps,
  SiteDeploymentMetaProps,
  SiteDeploymentRecordProps,
  SiteLiveSiteProps,
} from "@/types/components/sites";
import type { SiteDeployment, SiteDeploymentStep } from "@/types/sites";
import { deploymentSteps } from "@/utils/site-deployment-steps";
import {
  commitTitle,
  deploymentElapsedMs,
  deploymentServedUrls,
  formatBuildDuration,
  isDeploymentInProgress,
  isDeploymentLive,
  shortSha,
} from "@/utils/site-deployments";
import {
  siteDiagnosticLocation,
  siteDiagnosticSeverityRank,
} from "@/utils/site-diagnostics";
import {
  displayUrl,
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
  const redeploy = useRedeployDeployment({ organizationId, siteId });
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
  const visibility =
    detail.previews.find((preview) => preview.deploymentId === deployment.id)
      ?.visibility ?? detail.site.previewVisibility;
  const isProtected = deployment.kind === "preview" && visibility !== "public";

  const failure =
    failed || deployment.diagnostics.length > 0 ? (
      <FailureSummary deployment={deployment} />
    ) : null;

  let readyNote: string | undefined;
  if (deployment.status === "expired") {
    readyNote = t("steps.expiredNote");
  } else if (deployment.status === "ready" && !live) {
    readyNote = t("steps.notLiveNote");
  }

  const renderStep = (step: SiteDeploymentStep, index: number) => {
    const last = index === steps.length - 1;
    const duration = formatBuildDuration(step.durationMs);
    if (step.key === "queued") {
      return (
        <SiteDeploymentTimelineStep
          key={step.key}
          label={t("steps.queued")}
          last={last}
          note={step.state === "active" ? t("steps.waiting") : undefined}
          state={step.state}
          time={duration}
        >
          {step.state === "failed" ? failure : null}
        </SiteDeploymentTimelineStep>
      );
    }
    if (step.key === "building") {
      // A canceled build that had started still has a log worth reading.
      const hasContent =
        step.state !== "pending" && (step.state !== "skipped" || Boolean(log));
      return (
        <SiteDeploymentTimelineStep
          collapsible={
            hasContent ? { open: logOpen, onOpenChange: setLogOpen } : undefined
          }
          key={step.key}
          label={t("steps.building")}
          last={last}
          note={hasContent && !logOpen ? t("steps.showLog") : undefined}
          state={step.state}
          time={duration}
        >
          {hasContent ? (
            <div className="space-y-4">
              {failure}
              <SiteBuildLogs
                inProgress={inProgress}
                log={log}
                queued={deployment.status === "queued"}
                startAtEnd={failed}
              />
            </div>
          ) : null}
        </SiteDeploymentTimelineStep>
      );
    }
    if (step.key === "uploading") {
      return (
        <SiteDeploymentTimelineStep
          key={step.key}
          label={t("steps.publishing")}
          last={last}
          state={step.state}
        />
      );
    }
    return (
      <SiteDeploymentTimelineStep
        key={step.key}
        label={live ? t("steps.live") : t("steps.ready")}
        last={last}
        note={readyNote}
        state={step.state}
        time={
          step.state === "done" && deployment.finishedAt ? (
            <SiteRelativeTime date={deployment.finishedAt} />
          ) : null
        }
      >
        {live && !isProtected ? <LiveSite url={primaryUrl} /> : null}
      </SiteDeploymentTimelineStep>
    );
  };

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
              canRollback={listEntry?.canRollback ?? false}
              className="size-9"
              deployment={{ ...deployment, live, url: primaryUrl }}
              onRedeploy={() => redeploy.mutate(deployment.id)}
              onRollback={() => setRollbackTarget(listEntry)}
              redeployPending={redeploy.isPending}
              showVisit={false}
              triggerVariant="outline"
            />
          )}
        </div>
      </header>

      <InstrumentSection eyebrow={t("sections.build")}>
        <SiteDeploymentTimeline label={t("steps.label")}>
          {steps.map(renderStep)}
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

/** The error a failed build ended with, then what the checks found, by file and line. */
function FailureSummary({ deployment }: SiteDeploymentRecordProps) {
  const t = useTranslations("sites.deploymentPage");
  const tDiagnostics = useTranslations("sites.diagnostics");
  const diagnostics = [...deployment.diagnostics].sort(
    (a, b) => siteDiagnosticSeverityRank(a) - siteDiagnosticSeverityRank(b)
  );
  const failed = deployment.status === "failed";

  return (
    <div className="space-y-3">
      {failed ? (
        <div className="space-y-1" role="alert">
          <p className="font-medium">{t("notice.failed")}</p>
          {deployment.errorMessage ? (
            <p className="text-muted-foreground font-mono text-xs leading-5 [overflow-wrap:anywhere] whitespace-pre-wrap">
              {deployment.errorMessage}
            </p>
          ) : null}
        </div>
      ) : null}
      {diagnostics.length > 0 ? (
        <ul aria-label={t("diagnostics.title")} className="space-y-2">
          {diagnostics.map((diagnostic, index) => {
            const where = siteDiagnosticLocation(diagnostic);
            const isError = diagnostic.severity === "error";
            return (
              <li
                className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-2"
                // Diagnostics have no id; position plus code is stable for one result.
                key={`${index}-${diagnostic.code}`}
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 size-4",
                    isError ? "text-destructive" : "text-warning"
                  )}
                  icon={isError ? CancelCircleIcon : InformationCircleIcon}
                  strokeWidth={1.5}
                />
                <div className="min-w-0">
                  <p className="text-pretty">
                    <span className="sr-only">
                      {isError
                        ? tDiagnostics("error")
                        : tDiagnostics("warning")}
                      :{" "}
                    </span>
                    {diagnostic.message}
                  </p>
                  <p className="text-muted-foreground flex min-w-0 flex-wrap gap-x-3 font-mono text-xs">
                    {where ? (
                      <span className="[overflow-wrap:anywhere]">{where}</span>
                    ) : null}
                    <span>{diagnostic.code}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/** The end of the story: a small look at the live page and where it lives. */
function LiveSite({ url }: SiteLiveSiteProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <a
        aria-hidden="true"
        className="block w-full max-w-64 shrink-0 rounded-lg transition-opacity duration-150 hover:opacity-90 sm:w-56"
        href={url}
        rel="noopener noreferrer"
        tabIndex={-1}
        target="_blank"
      >
        <SitePreviewFrame className="rounded-lg" url={url} />
      </a>
      <a
        className="group inline-flex min-w-0 items-center gap-1 font-medium"
        href={url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="decoration-foreground/25 group-hover:decoration-foreground truncate underline underline-offset-4 transition-colors duration-150">
          {displayUrl(url)}
        </span>
        <HugeiconsIcon
          aria-hidden="true"
          className="text-muted-foreground size-3.5 shrink-0"
          icon={ArrowUpRight01Icon}
          strokeWidth={1.5}
        />
      </a>
    </div>
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
