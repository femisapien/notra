"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { useInvalidateSites } from "@/lib/hooks/use-sites";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { SitePreviewDeleteDialogProps } from "@/types/components/sites";
import { toErrorMessage } from "@/utils/error-message";

/** Confirms taking a preview down; open while `preview` is set. */
export function SitePreviewDeleteDialog({
  organizationId,
  siteId,
  preview,
  onOpenChange,
}: SitePreviewDeleteDialogProps) {
  const t = useTranslations("sites.previewsPage");
  const tCommon = useTranslations("common");
  const invalidateSites = useInvalidateSites();

  const deleteMutation = useMutation({
    mutationFn: (previewKey: string) =>
      dashboardOrpc.sites.previews.delete.call({
        organizationId,
        siteId,
        previewKey,
      }),
    onSuccess: async () => {
      toast.success(t("deleted"));
      onOpenChange(false);
      await invalidateSites();
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, t("deleteFailed")));
    },
  });

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={preview !== null}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("deleteTitle")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t("deleteDescription", {
              name: preview?.branch ?? preview?.previewKey ?? "",
            })}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogFooter>
          <Button
            disabled={deleteMutation.isPending}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            {tCommon("actions.cancel")}
          </Button>
          <Button
            loading={deleteMutation.isPending}
            onClick={() => {
              if (preview) {
                deleteMutation.mutate(preview.previewKey);
              }
            }}
            variant="destructive"
          >
            {t("delete")}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
