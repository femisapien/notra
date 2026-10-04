"use client";

import { Label } from "@notra/ui/components/ui/label";
import { Switch } from "@notra/ui/components/ui/switch";
import { useTranslations } from "next-intl";

import { useSite } from "@/components/sites/site-context";
import type { SitePreviewBuildToggleProps } from "@/types/components/site-preview-access";

/** Previews on or off, with what turning them off does to the open ones. */
export function SitePreviewBuildToggle({
  id,
  enabled,
  onEnabledChange,
}: SitePreviewBuildToggleProps) {
  const t = useTranslations("sites.previewAccess");
  const { detail } = useSite();
  const { site } = detail;
  const openPreviewCount = detail.previews.length;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-0.5">
          <Label htmlFor={id}>{t("buildLabel")}</Label>
          <p className="text-muted-foreground text-sm text-pretty">
            {t.rich("buildDescription", {
              branch: () => (
                <code className="text-foreground font-mono text-xs">
                  {site.productionBranch}
                </code>
              ),
            })}
          </p>
        </div>
        <Switch
          checked={enabled}
          className="mt-0.5"
          id={id}
          onCheckedChange={onEnabledChange}
        />
      </div>
      {site.previewsEnabled && !enabled ? (
        <p className="text-muted-foreground bg-muted rounded-lg px-3 py-2 text-sm text-pretty">
          {openPreviewCount > 0
            ? t("buildOffWarning", { count: openPreviewCount })
            : t("buildOffHint")}
        </p>
      ) : null}
    </div>
  );
}
