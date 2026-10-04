"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Table, type TableColumn } from "@/components/motion/table";
import { SiteDeploymentMenu } from "@/components/sites/site-deployment-menu";
import { SiteRelativeTime } from "@/components/sites/site-relative-time";
import { SiteRollbackDialog } from "@/components/sites/site-rollback-dialog";
import { SiteStatusDot } from "@/components/sites/site-status-dot";
import {
  SITE_DEPLOYMENT_ROW_HEIGHT,
  SITE_ENVIRONMENT_ICONS,
  SITE_ENVIRONMENT_PILL_CLASS,
  SITE_ENVIRONMENT_PILL_TONE,
  SITE_TABLE_EMPTY_HEIGHT,
} from "@/constants/sites";
import { useNow } from "@/lib/hooks/use-now";
import { useRedeployDeployment } from "@/lib/hooks/use-site-deployments";
import { cn } from "@/lib/utils";
import type { SiteDeploymentsTableProps } from "@/types/components/sites";
import type { SiteDeployment } from "@/types/sites";
import {
  commitTitle,
  deploymentElapsedMs,
  formatBuildDuration,
  hasDeploymentInProgress,
  shortSha,
} from "@/utils/site-deployments";
import { siteDeploymentHref } from "@/utils/site-links";
import { tableHeightFor } from "@/utils/table";

/**
 * Deployments as rows, laid out like the feedback table: commit, environment
 * pill, status, author and time. The
 * deployments page and the overview's activity share it, so a build reads
 * the same everywhere; the page adds a row menu, the overview stays bare.
 */
export function SiteDeploymentsTable({
  organizationId,
  organizationSlug,
  siteId,
  deployments,
  emptyState,
  withActions = false,
  highlightNewRows = false,
  emptyHeight = SITE_TABLE_EMPTY_HEIGHT,
  fitRows = false,
}: SiteDeploymentsTableProps) {
  const t = useTranslations("sites.deploymentsPage");
  const tKinds = useTranslations("sites.kinds");
  const tTriggers = useTranslations("sites.triggers");
  const tDeployments = useTranslations("sites.deployments");
  const router = useRouter();
  const scope = { organizationId, siteId };
  const redeploy = useRedeployDeployment(scope);
  const now = useNow(hasDeploymentInProgress(deployments));
  const [rollbackTarget, setRollbackTarget] = useState<SiteDeployment | null>(
    null
  );
  // Only builds created while the page is open glow; filtering never does.
  const [mountedAt] = useState(() => Date.now());
  const href = (deployment: SiteDeployment) =>
    siteDeploymentHref(organizationSlug, siteId, deployment.id);

  let tableHeight = emptyHeight;
  if (deployments.length > 0) {
    // The header takes one row's height.
    tableHeight = fitRows
      ? (deployments.length + 1) * SITE_DEPLOYMENT_ROW_HEIGHT
      : tableHeightFor(deployments.length, SITE_DEPLOYMENT_ROW_HEIGHT);
  }

  const columns: TableColumn<SiteDeployment>[] = [
    {
      key: "deployment",
      header: t("columns.deployment"),
      width: "1fr",
      minWidth: "16rem",
      sortable: true,
      sortValue: (deployment) => commitTitle(deployment.commitMessage) ?? "",
      cell: (deployment) => {
        const title = commitTitle(deployment.commitMessage);
        return (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span
              className={cn(
                "truncate text-sm font-medium",
                !title && "text-muted-foreground font-normal"
              )}
              title={title ?? undefined}
            >
              {title ?? tDeployments("noCommitMessage")}
            </span>
            <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
              <span className="shrink-0 font-mono">
                {shortSha(deployment.commitSha)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate font-mono" title={deployment.branch}>
                {deployment.branch}
              </span>
            </span>
          </span>
        );
      },
    },
    {
      key: "environment",
      header: t("columns.environment"),
      width: "10rem",
      collapsePriority: 2,
      sortable: true,
      sortValue: (deployment) => deployment.kind,
      cell: (deployment) => (
        <span
          className={cn(
            SITE_ENVIRONMENT_PILL_CLASS,
            SITE_ENVIRONMENT_PILL_TONE[deployment.kind]
          )}
        >
          <HugeiconsIcon
            aria-hidden
            className="size-3.5 shrink-0"
            icon={SITE_ENVIRONMENT_ICONS[deployment.kind]}
            strokeWidth={2}
          />
          <span className="truncate">
            {deployment.previewKey ?? tKinds(deployment.kind)}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: t("columns.status"),
      width: "9rem",
      sortable: true,
      sortValue: (deployment) => deployment.status,
      cell: (deployment) => (
        <SiteStatusDot
          duration={
            deployment.status === "ready" ||
            deployment.status === "building" ||
            deployment.status === "uploading"
              ? formatBuildDuration(deploymentElapsedMs(deployment, now))
              : null
          }
          live={deployment.live}
          status={deployment.status}
        />
      ),
    },
    {
      key: "author",
      header: t("columns.author"),
      width: "10rem",
      collapsePriority: 3,
      sortable: true,
      sortValue: (deployment) =>
        deployment.commitAuthor ?? tTriggers(deployment.trigger),
      cell: (deployment) => (
        <span
          className="text-muted-foreground block truncate text-xs"
          title={tTriggers(deployment.trigger)}
        >
          {deployment.commitAuthor ?? tTriggers(deployment.trigger)}
        </span>
      ),
    },
    {
      key: "created",
      header: t("columns.created"),
      width: "8rem",
      align: "right",
      collapsePriority: 1,
      sortable: true,
      sortValue: (deployment) => new Date(deployment.createdAt).getTime(),
      cell: (deployment) => (
        <SiteRelativeTime
          className="text-muted-foreground text-xs whitespace-nowrap tabular-nums"
          date={deployment.createdAt}
        />
      ),
    },
  ];

  if (withActions) {
    columns.push({
      key: "actions",
      header: <span className="sr-only">{t("columns.actions")}</span>,
      width: "3.25rem",
      align: "right",
      cell: (deployment) => (
        // Menu events bubble through the portal to the row; keep them here.
        <span
          className="-my-1 flex justify-end"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <SiteDeploymentMenu
            canRollback={deployment.canRollback}
            deployment={deployment}
            detailHref={href(deployment)}
            onRedeploy={() => redeploy.mutate(deployment.id)}
            onRollback={() => setRollbackTarget(deployment)}
            redeployPending={redeploy.isPending}
          />
        </span>
      ),
    });
  }

  return (
    <>
      <Table
        className="rounded-2xl"
        columns={columns}
        data={deployments}
        emptyState={emptyState}
        getRowClassName={(deployment) =>
          highlightNewRows &&
          new Date(deployment.createdAt).getTime() > mountedAt
            ? "motion-safe:animate-[geo-log-row-glow_2.4s_ease-out_backwards]"
            : undefined
        }
        defaultSort={{ key: "created", direction: "desc" }}
        getRowId={(deployment) => deployment.id}
        height={tableHeight}
        onRowClick={(deployment) => router.push(href(deployment))}
        onRowPointerEnter={(deployment) => router.prefetch(href(deployment))}
        resizable
        rowHeight={SITE_DEPLOYMENT_ROW_HEIGHT}
        scrollFade={false}
      />
      {withActions ? (
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
      ) : null}
    </>
  );
}
