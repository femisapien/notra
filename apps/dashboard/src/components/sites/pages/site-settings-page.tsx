"use client";

import { Folder01Icon, GitBranchIcon } from "@hugeicons/core-free-icons";
import { Input } from "@notra/ui/components/ui/input";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { PageHeader } from "@/components/layout/page-header";
import { useSite } from "@/components/sites/site-context";
import {
  SiteChoiceGroup,
  SiteSectionsFields,
} from "@/components/sites/site-form-fields";
import { SitePreviewAccessDialog } from "@/components/sites/site-preview-access-dialog";
import { SiteSettingsDangerZone } from "@/components/sites/site-settings-danger-zone";
import { SiteSettingsRow } from "@/components/sites/site-settings-row";
import { SiteSettingsSaveBar } from "@/components/sites/site-settings-save-bar";
import { SiteSuggestInput } from "@/components/sites/site-suggest-input";
import { useRepositorySuggestions } from "@/lib/hooks/use-repository-suggestions";
import { useSitePublishModeOptions } from "@/lib/hooks/use-site-choice-options";
import { useInvalidateSites } from "@/lib/hooks/use-sites";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { SiteSettingsFormProps } from "@/types/components/sites";
import type { SiteSettingsForm as SiteSettingsFormValues } from "@/types/sites";
import { toErrorMessage } from "@/utils/error-message";
import { sitePreviewAccessMode } from "@/utils/site-preview-access";
import {
  siteSettingsFormFromSite,
  siteSettingsPatch,
} from "@/utils/site-settings";

export function SiteSettingsPage() {
  const { organizationId, organizationSlug, siteId, detail } = useSite();
  return (
    <SiteSettingsForm
      detail={detail}
      key={detail.site.id}
      organizationId={organizationId}
      organizationSlug={organizationSlug}
      siteId={siteId}
    />
  );
}

function SiteSettingsForm({
  organizationId,
  organizationSlug,
  siteId,
  detail,
}: SiteSettingsFormProps) {
  const t = useTranslations("sites.settings");
  const tPage = useTranslations("sites.settingsPage");
  const tNew = useTranslations("sites.new");
  const tSections = useTranslations("sites.sections");
  const id = useId();
  const invalidateSites = useInvalidateSites();
  const tAccess = useTranslations("sites.previewAccess");
  const [accessOpen, setAccessOpen] = useState(false);
  const publishModeOptions = useSitePublishModeOptions();
  const { site } = detail;
  const [form, setForm] = useState<SiteSettingsFormValues>(() =>
    siteSettingsFormFromSite(site)
  );
  const suggestions = useRepositorySuggestions({
    organizationId,
    siteId,
    branch: form.productionBranch.trim(),
  });
  const patch = siteSettingsPatch(form, site);
  const dirty = Object.keys(patch).length > 0;
  const valid =
    form.name.trim().length > 0 &&
    form.productionBranch.trim().length > 0 &&
    (form.blogEnabled || form.changelogEnabled);

  const update = <K extends keyof SiteSettingsFormValues>(
    key: K,
    value: SiteSettingsFormValues[K]
  ) => setForm((current) => ({ ...current, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: () =>
      dashboardOrpc.sites.update.call({ organizationId, siteId, ...patch }),
    onSuccess: async (result) => {
      setForm(siteSettingsFormFromSite(result.site));
      if (result.rebuilding) {
        toast.success(t("savedRebuilding"));
      } else {
        toast.success(t("saved"));
      }
      await invalidateSites();
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, t("saveFailed")));
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader description={tPage("description")} title={tPage("title")} />
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (dirty && valid && !saveMutation.isPending) {
            saveMutation.mutate();
          }
        }}
      >
        <TitleCard as="section" heading={t("general")} headingAs="h2">
          <div className="divide-border divide-y">
            <SiteSettingsRow htmlFor={`${id}-name`} label={tNew("name")}>
              <Input
                id={`${id}-name`}
                maxLength={80}
                onChange={(event) => update("name", event.target.value)}
                value={form.name}
              />
            </SiteSettingsRow>
            <SiteSettingsRow
              description={tNew("branchHint")}
              htmlFor={`${id}-branch`}
              label={tNew("branch")}
            >
              <SiteSuggestInput
                emptyLabel={tNew("noBranchMatch")}
                icon={GitBranchIcon}
                id={`${id}-branch`}
                onValueChange={(value) => update("productionBranch", value)}
                suggestions={suggestions.branches}
                value={form.productionBranch}
              />
            </SiteSettingsRow>
            <SiteSettingsRow
              description={tNew("rootDirectoryHint")}
              htmlFor={`${id}-root`}
              label={tNew("rootDirectory")}
            >
              <SiteSuggestInput
                emptyLabel={tNew("noDirectoryMatch")}
                icon={Folder01Icon}
                id={`${id}-root`}
                onValueChange={(value) => update("rootDirectory", value)}
                placeholder={tNew("rootDirectoryPlaceholder")}
                suggestions={suggestions.configDirectories.filter(Boolean)}
                value={form.rootDirectory}
              />
            </SiteSettingsRow>
          </div>
        </TitleCard>

        <TitleCard as="section" heading={t("content")} headingAs="h2">
          <div className="divide-border divide-y">
            <SiteSettingsRow
              description={tPage("sectionsHint")}
              label={tSections("title")}
            >
              <SiteSectionsFields
                blogEnabled={form.blogEnabled}
                blogPath={form.blogPath}
                changelogEnabled={form.changelogEnabled}
                changelogPath={form.changelogPath}
                idPrefix={id}
                onBlogEnabledChange={(value) => update("blogEnabled", value)}
                onBlogPathChange={(value) => update("blogPath", value)}
                onChangelogEnabledChange={(value) =>
                  update("changelogEnabled", value)
                }
                onChangelogPathChange={(value) =>
                  update("changelogPath", value)
                }
              />
            </SiteSettingsRow>
          </div>
        </TitleCard>

        <TitleCard as="section" heading={t("previews")} headingAs="h2">
          <SiteSettingsRow
            description={t("previewsEnabledHint")}
            label={tAccess("title")}
          >
            <div className="flex items-center gap-3 lg:pt-1">
              <span className="text-sm">
                {site.previewsEnabled
                  ? tAccess(`trigger.${sitePreviewAccessMode(site)}`)
                  : tAccess("trigger.off")}
              </span>
              <Button
                onClick={() => setAccessOpen(true)}
                size="sm"
                type="button"
                variant="outline"
              >
                {tPage("changeAccess")}
              </Button>
            </div>
          </SiteSettingsRow>
        </TitleCard>

        <TitleCard as="section" heading={t("publishing")} headingAs="h2">
          <div className="divide-border divide-y">
            <SiteSettingsRow label={tNew("publishMode")}>
              <SiteChoiceGroup
                hideLabel
                label={tNew("publishMode")}
                onValueChange={(value) => update("publishMode", value)}
                options={publishModeOptions}
                value={form.publishMode}
              />
            </SiteSettingsRow>
          </div>
        </TitleCard>

        {dirty ? (
          <SiteSettingsSaveBar
            canSave={valid}
            isSaving={saveMutation.isPending}
            onReset={() => setForm(siteSettingsFormFromSite(site))}
          />
        ) : null}
      </form>

      <SiteSettingsDangerZone
        organizationId={organizationId}
        organizationSlug={organizationSlug}
        site={site}
        siteId={siteId}
      />
      <SitePreviewAccessDialog onOpenChange={setAccessOpen} open={accessOpen} />
    </div>
  );
}
