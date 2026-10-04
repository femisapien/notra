"use client";

import {
  GitBranchIcon,
  GitPullRequestIcon,
  InformationCircleIcon,
  PlusSignIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@notra/ui/components/ui/empty";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { PageHeader } from "@/components/layout/page-header";
import { useSite } from "@/components/sites/site-context";
import { SitePreviewAccessDialog } from "@/components/sites/site-preview-access-dialog";
import { SitePreviewsTable } from "@/components/sites/site-previews-table";
import { useInvalidateSites } from "@/lib/hooks/use-sites";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { SitePreviewBranchDialogProps } from "@/types/components/sites";
import { toErrorMessage } from "@/utils/error-message";
import {
  sitePreviewAccessMode,
  sitePreviewAccessModeConfig,
} from "@/utils/site-preview-access";
import { sitePreviewRows } from "@/utils/site-previews";

function PreviewBranchDialog({
  organizationId,
  siteId,
  open,
  onOpenChange,
}: SitePreviewBranchDialogProps) {
  const t = useTranslations("sites.previewsPage");
  const tCommon = useTranslations("common");
  const id = useId();
  const invalidateSites = useInvalidateSites();
  const [branch, setBranch] = useState("");
  const trimmedBranch = branch.trim();

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      dashboardOrpc.sites.previews.createForBranch.call({
        organizationId,
        siteId,
        branch: name,
      }),
    onSuccess: async (result) => {
      toast.success(t("created", { key: result.previewKey }));
      setBranch("");
      onOpenChange(false);
      await invalidateSites();
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, t("createFailed")));
    },
  });

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("branchTitle")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t("branchDescription")}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form
          className="space-y-2"
          id={`${id}-form`}
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmedBranch && !createMutation.isPending) {
              createMutation.mutate(trimmedBranch);
            }
          }}
        >
          <Label htmlFor={`${id}-branch`}>{t("branchLabel")}</Label>
          <Input
            autoComplete="off"
            autoFocus
            id={`${id}-branch`}
            onChange={(event) => setBranch(event.target.value)}
            placeholder={t("branchPlaceholder")}
            spellCheck={false}
            value={branch}
          />
        </form>
        <ResponsiveDialogFooter>
          <Button
            disabled={createMutation.isPending}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            {tCommon("actions.cancel")}
          </Button>
          <Button
            disabled={!trimmedBranch}
            form={`${id}-form`}
            loading={createMutation.isPending}
            type="submit"
          >
            {t("createPreview")}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export function SitePreviewsPage() {
  const { organizationId, organizationSlug, siteId, detail } = useSite();
  const t = useTranslations("sites.previewsPage");
  const tAccess = useTranslations("sites.previewAccess");
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const { site } = detail;
  const rows = sitePreviewRows(detail);
  const accessMode = sitePreviewAccessModeConfig(sitePreviewAccessMode(site));

  return (
    <>
      <PageHeader description={t("description")} title={t("title")}>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setAccessOpen(true)} variant="outline">
            <HugeiconsIcon
              icon={site.previewsEnabled ? accessMode.icon : ViewOffIcon}
              size={16}
              strokeWidth={1.5}
            />
            {site.previewsEnabled
              ? tAccess(`trigger.${accessMode.mode}`)
              : tAccess("trigger.off")}
          </Button>
          <Button
            disabled={!site.previewsEnabled}
            onClick={() => setBranchDialogOpen(true)}
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            {t("branchTitle")}
          </Button>
        </div>
      </PageHeader>

      {site.previewsEnabled ? null : (
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-sm">
          <HugeiconsIcon
            aria-hidden="true"
            className="size-4 shrink-0"
            icon={InformationCircleIcon}
            strokeWidth={1.5}
          />
          {t("disabled")}
          <button
            className="text-foreground decoration-foreground/25 hover:decoration-foreground cursor-pointer font-medium underline underline-offset-4 transition-colors duration-150"
            onClick={() => setAccessOpen(true)}
            type="button"
          >
            {tAccess("turnOn")}
          </button>
        </p>
      )}

      <SitePreviewsTable
        emptyState={
          <div className="text-foreground w-full">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={GitPullRequestIcon} strokeWidth={1.5} />
                </EmptyMedia>
                <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
                <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
              </EmptyHeader>
              {site.previewsEnabled ? (
                <EmptyContent>
                  <Button
                    onClick={() => setBranchDialogOpen(true)}
                    size="sm"
                    variant="outline"
                  >
                    <HugeiconsIcon
                      icon={GitBranchIcon}
                      size={14}
                      strokeWidth={1.5}
                    />
                    {t("branchTitle")}
                  </Button>
                </EmptyContent>
              ) : null}
            </Empty>
          </div>
        }
        organizationId={organizationId}
        organizationSlug={organizationSlug}
        repository={site.repository}
        rows={rows}
        siteId={siteId}
      />

      <SitePreviewAccessDialog onOpenChange={setAccessOpen} open={accessOpen} />

      <PreviewBranchDialog
        onOpenChange={setBranchDialogOpen}
        open={branchDialogOpen}
        organizationId={organizationId}
        siteId={siteId}
      />
    </>
  );
}
