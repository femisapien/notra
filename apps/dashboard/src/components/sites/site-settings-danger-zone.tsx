"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { SiteDeleteDialog } from "@/components/sites/site-delete-dialog";
import { useInvalidateSites } from "@/lib/hooks/use-sites";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { SiteSettingsDangerZoneProps } from "@/types/components/sites";
import { toErrorMessage } from "@/utils/error-message";

/** Take the site offline (or bring it back) and delete it, each behind a confirmation. */
export function SiteSettingsDangerZone({
  organizationId,
  organizationSlug,
  siteId,
  site,
}: SiteSettingsDangerZoneProps) {
  const t = useTranslations("sites.settings");
  const tCommon = useTranslations("common");
  const invalidateSites = useInvalidateSites();
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const suspended = site.status === "suspended";

  const suspendMutation = useMutation({
    mutationFn: (next: boolean) =>
      dashboardOrpc.sites.setSuspended.call({
        organizationId,
        siteId,
        suspended: next,
      }),
    onSuccess: async (_result, next) => {
      toast.success(next ? t("offline.done") : t("offline.restored"));
      setOfflineOpen(false);
      await invalidateSites();
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, t("offline.failed")));
    },
  });

  return (
    <>
      <TitleCard
        as="section"
        className="border-destructive/50 bg-destructive/5"
        heading={t("dangerZone")}
        headingAs="h2"
      >
        <div className="divide-border divide-y">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-1">
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium">
                {suspended ? t("offline.restoreTitle") : t("offline.title")}
              </p>
              <p className="text-muted-foreground text-xs">
                {suspended
                  ? t("offline.restoreDescription")
                  : t("offline.description")}
              </p>
            </div>
            {suspended ? (
              <Button
                loading={suspendMutation.isPending}
                onClick={() => suspendMutation.mutate(false)}
                type="button"
                variant="outline"
              >
                {t("offline.restore")}
              </Button>
            ) : (
              <Button
                onClick={() => setOfflineOpen(true)}
                type="button"
                variant="outline"
              >
                {t("offline.action")}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 last:pb-1">
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium">{t("delete.title")}</p>
              <p className="text-muted-foreground text-xs">
                {t("delete.summary")}
              </p>
            </div>
            <Button
              onClick={() => setDeleteOpen(true)}
              type="button"
              variant="destructive"
            >
              {t("delete.action")}
            </Button>
          </div>
        </div>
      </TitleCard>

      <ResponsiveDialog onOpenChange={setOfflineOpen} open={offlineOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {t("offline.confirmTitle")}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t("offline.confirmDescription")}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button
              disabled={suspendMutation.isPending}
              onClick={() => setOfflineOpen(false)}
              type="button"
              variant="outline"
            >
              {tCommon("actions.cancel")}
            </Button>
            <Button
              loading={suspendMutation.isPending}
              onClick={() => suspendMutation.mutate(true)}
              type="button"
              variant="destructive"
            >
              {t("offline.action")}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
      <SiteDeleteDialog
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        organizationId={organizationId}
        organizationSlug={organizationSlug}
        siteId={siteId}
        siteName={site.name}
      />
    </>
  );
}
