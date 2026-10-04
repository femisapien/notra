"use client";

import {
  ArrowUpRight01Icon,
  CancelCircleIcon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";

import { SiteBuildLogs } from "@/components/sites/site-build-logs";
import { SiteDeploymentTimelineStep } from "@/components/sites/site-deployment-timeline";
import { SitePreviewFrame } from "@/components/sites/site-preview-frame";
import { SiteRelativeTime } from "@/components/sites/site-relative-time";
import { cn } from "@/lib/utils";
import type {
  SiteDeploymentBuildStepProps,
  SiteDeploymentRecordProps,
  SiteLiveSiteProps,
} from "@/types/components/sites";
import {
  formatBuildDuration,
  isDeploymentInProgress,
} from "@/utils/site-deployments";
import {
  siteDiagnosticLocation,
  siteDiagnosticSeverityRank,
  withDiagnosticKeys,
} from "@/utils/site-diagnostics";
import { displayUrl } from "@/utils/site-links";

/** One step of a deployment's build timeline: queued, building, publishing, then live or ready. */
export function SiteDeploymentBuildStep(props: SiteDeploymentBuildStepProps) {
  switch (props.step.key) {
    case "queued":
      return <QueuedStep {...props} />;
    case "building":
      return <BuildingStep {...props} />;
    case "uploading":
      return <PublishingStep {...props} />;
    default:
      return <ReadyStep {...props} />;
  }
}

function QueuedStep({ step, last, deployment }: SiteDeploymentBuildStepProps) {
  const t = useTranslations("sites.deploymentPage");
  return (
    <SiteDeploymentTimelineStep
      label={t("steps.queued")}
      last={last}
      note={step.state === "active" ? t("steps.waiting") : undefined}
      state={step.state}
      time={formatBuildDuration(step.durationMs)}
    >
      {step.state === "failed" ? <Failure deployment={deployment} /> : null}
    </SiteDeploymentTimelineStep>
  );
}

function BuildingStep({
  step,
  last,
  deployment,
  log,
  logOpen,
  onLogOpenChange,
}: SiteDeploymentBuildStepProps) {
  const t = useTranslations("sites.deploymentPage");
  // A canceled build that had started still has a log worth reading.
  const hasContent =
    step.state !== "pending" && (step.state !== "skipped" || Boolean(log));
  return (
    <SiteDeploymentTimelineStep
      collapsible={
        hasContent
          ? { open: logOpen, onOpenChange: onLogOpenChange }
          : undefined
      }
      label={t("steps.building")}
      last={last}
      note={hasContent && !logOpen ? t("steps.showLog") : undefined}
      state={step.state}
      time={formatBuildDuration(step.durationMs)}
    >
      {hasContent ? (
        <div className="space-y-4">
          <Failure deployment={deployment} />
          <SiteBuildLogs
            inProgress={isDeploymentInProgress(deployment.status)}
            log={log}
            queued={deployment.status === "queued"}
            startAtEnd={deployment.status === "failed"}
          />
        </div>
      ) : null}
    </SiteDeploymentTimelineStep>
  );
}

function PublishingStep({ step, last }: SiteDeploymentBuildStepProps) {
  const t = useTranslations("sites.deploymentPage");
  return (
    <SiteDeploymentTimelineStep
      label={t("steps.publishing")}
      last={last}
      state={step.state}
    />
  );
}

function ReadyStep({
  step,
  last,
  deployment,
  live,
  liveUrl,
}: SiteDeploymentBuildStepProps) {
  const t = useTranslations("sites.deploymentPage");
  let readyNote: string | undefined;
  if (deployment.status === "expired") {
    readyNote = t("steps.expiredNote");
  } else if (deployment.status === "ready" && !live) {
    readyNote = t("steps.notLiveNote");
  }
  return (
    <SiteDeploymentTimelineStep
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
      {liveUrl ? <LiveSite url={liveUrl} /> : null}
    </SiteDeploymentTimelineStep>
  );
}

/** The failure summary, for builds that failed or whose checks found something. */
function Failure({ deployment }: SiteDeploymentRecordProps) {
  if (deployment.status !== "failed" && deployment.diagnostics.length === 0) {
    return null;
  }
  return <FailureSummary deployment={deployment} />;
}

/** The error a failed build ended with, then what the checks found, by file and line. */
function FailureSummary({ deployment }: SiteDeploymentRecordProps) {
  const t = useTranslations("sites.deploymentPage");
  const tDiagnostics = useTranslations("sites.diagnostics");
  const diagnostics = withDiagnosticKeys(
    [...deployment.diagnostics].sort(
      (a, b) => siteDiagnosticSeverityRank(a) - siteDiagnosticSeverityRank(b)
    )
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
          {diagnostics.map(({ diagnostic, key }) => {
            const where = siteDiagnosticLocation(diagnostic);
            const isError = diagnostic.severity === "error";
            return (
              <li
                className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-2"
                key={key}
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
