"use client";

import {
  ArrowUpRight01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  MultiplicationSignCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslations } from "use-intl";

import { Button, buttonVariants } from "@/components/button";
import Link from "@/components/framework/link";
import { SiteBuildLogs } from "@/components/sites/site-build-logs";
import { SITE_CREATE_DEPLOY_POLL_MS } from "@/constants/site-create";
import { MS_PER_SECOND } from "@/constants/site-deployments";
import { useNow } from "@/lib/hooks/use-now";
import {
  useDeployLatest,
  useSiteDeployment,
} from "@/lib/hooks/use-site-deployments";
import { dashboardOrpc } from "@/lib/orpc/query";
import { cn } from "@/lib/utils";
import type { SiteCreateDeployProps } from "@/types/components/sites";
import { toErrorMessage } from "@/utils/error-message";
import {
  deploymentElapsedMs,
  formatBuildDuration,
  isDeploymentInProgress,
  stripAnsi,
} from "@/utils/site-deployments";
import { siteHref } from "@/utils/site-links";

export function SiteCreateDeploy({
  organizationId,
  organizationSlug,
  site,
  deploymentQueued,
}: SiteCreateDeployProps) {
  const t = useTranslations("sites.new.deploy");
  const [retryFromDeploymentId, setRetryFromDeploymentId] = useState<
    string | null
  >(null);
  const queued = deploymentQueued || retryFromDeploymentId !== null;
  const retry = useDeployLatest({ organizationId, siteId: site.id });
  const detail = useQuery(
    dashboardOrpc.sites.get.queryOptions({
      input: { organizationId, siteId: site.id },
      refetchInterval: (query) =>
        !queued ||
        (query.state.data?.deployments[0] &&
          query.state.data.deployments[0].id !== retryFromDeploymentId)
          ? false
          : SITE_CREATE_DEPLOY_POLL_MS,
    })
  );
  const latestId = detail.data?.deployments[0]?.id ?? "";
  const deploymentId = latestId === retryFromDeploymentId ? "" : latestId;
  const deployment = useSiteDeployment({
    organizationId: deploymentId ? organizationId : "",
    siteId: site.id,
    deploymentId,
  });
  const record = deploymentId ? (deployment.data?.deployment ?? null) : null;
  const lookupFailed =
    detail.isError || (deploymentId.length > 0 && deployment.isError);
  const status = record?.status ?? "queued";
  const inProgress = !lookupFailed && queued && isDeploymentInProgress(status);
  const failed =
    !lookupFailed && (!queued || status === "failed" || status === "canceled");
  const ready = !lookupFailed && record !== null && !(inProgress || failed);
  const failureSummary =
    record?.errorMessage?.trim() ||
    record?.diagnostics
      .find(
        (diagnostic) =>
          diagnostic.severity === "error" && diagnostic.message.trim()
      )
      ?.message.trim() ||
    t("failureRecovery");
  const log = record ? (deployment.data?.log ?? "") : "";
  const buildLog =
    failed && !stripAnsi(log).includes(failureSummary)
      ? `${log.trimEnd()}${log.trim() ? "\n" : ""}[error] ${failureSummary}`
      : log;
  const now = useNow(inProgress);
  const elapsed = record
    ? formatBuildDuration(deploymentElapsedMs(record, now))
    : null;
  const startedSeconds = record
    ? Math.max(
        0,
        Math.round((now - new Date(record.createdAt).getTime()) / MS_PER_SECOND)
      )
    : 0;

  let headline = t("waiting");
  if (lookupFailed) {
    headline = t("statusLoadFailed");
  } else if (!queued) {
    headline = t("notStarted");
  } else if (record && inProgress) {
    headline = t("started", { seconds: startedSeconds });
  } else if (ready) {
    headline = t("ready", { duration: elapsed ?? "" });
  } else if (failed) {
    headline = t("failed");
  }

  let icon = Loading03Icon;
  if (ready) {
    icon = CheckmarkCircle02Icon;
  } else if (failed || lookupFailed) {
    icon = MultiplicationSignCircleIcon;
  }

  const heading = (
    <span
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2",
        ready && "text-success",
        (failed || lookupFailed) && "text-destructive",
        !(ready || failed || lookupFailed) && "text-muted-foreground"
      )}
    >
      <HugeiconsIcon
        aria-hidden="true"
        className={cn(
          "size-4 shrink-0",
          !(ready || failed || lookupFailed) && "motion-safe:animate-spin"
        )}
        icon={icon}
        strokeWidth={1.75}
      />
      {failed || lookupFailed ? (
        <span className="text-foreground">{headline}</span>
      ) : (
        headline
      )}
    </span>
  );

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border">
        {!lookupFailed ? (
          <SiteBuildLogs
            heading={heading}
            inProgress={inProgress}
            log={buildLog || null}
            queued={!failed && (!record || status === "queued")}
          />
        ) : (
          <div className="p-4 text-sm">{heading}</div>
        )}
        <div className="flex flex-wrap items-center justify-end gap-4 border-t px-4 py-3">
          {!ready ? (
            <Link
              className="text-muted-foreground hover:text-foreground inline-flex min-h-8 items-center rounded-md text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
              href={siteHref(organizationSlug, site.id, "settings")}
            >
              {t("editConfiguration")}
            </Link>
          ) : null}
          {lookupFailed ? (
            <Button
              loading={detail.isFetching || deployment.isFetching}
              onClick={() => {
                void detail.refetch();
                if (deploymentId) {
                  void deployment.refetch();
                }
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              {t("retryStatus")}
            </Button>
          ) : null}
          {failed ? (
            <Button
              loading={retry.isPending}
              onClick={() => {
                if (!retry.isPending) {
                  retry.mutate(undefined, {
                    onSuccess: () => setRetryFromDeploymentId(deploymentId),
                  });
                }
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              {t("retryDeployment")}
            </Button>
          ) : null}
          {ready ? (
            <>
              <a
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href={site.liveUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t("visit")}
                <HugeiconsIcon
                  data-icon="inline-end"
                  icon={ArrowUpRight01Icon}
                />
              </a>
              <Link
                className={buttonVariants({ size: "sm" })}
                href={siteHref(organizationSlug, site.id)}
              >
                {t("openSite")}
              </Link>
            </>
          ) : null}
        </div>
      </div>
      {retry.isError ? (
        <p
          className="text-foreground text-sm [overflow-wrap:anywhere]"
          role="alert"
        >
          {toErrorMessage(retry.error, t("retryFailed"))}
        </p>
      ) : null}
    </div>
  );
}
