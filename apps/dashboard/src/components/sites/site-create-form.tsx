"use client";

import { Github01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Input } from "@notra/ui/components/ui/input";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useId, useState } from "react";

import { buttonVariants } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { SiteCreateBar } from "@/components/sites/site-create-bar";
import { SiteCreateSourceFields } from "@/components/sites/site-create-source-fields";
import {
  SiteChoiceGroup,
  SiteSectionsFields,
} from "@/components/sites/site-form-fields";
import { SiteRepositoryLayout } from "@/components/sites/site-repository-layout";
import { SiteRepositorySelect } from "@/components/sites/site-repository-select";
import { SiteSettingsRow } from "@/components/sites/site-settings-row";
import { SITE_CREATE_FORM_DEFAULTS } from "@/constants/site-create";
import { useActiveProject } from "@/lib/hooks/use-active-project";
import { useCreateSite } from "@/lib/hooks/use-create-site";
import {
  useSitePreviewVisibilityOptions,
  useSitePublishModeOptions,
} from "@/lib/hooks/use-site-choice-options";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { SiteCreateFormProps } from "@/types/components/sites";
import type { SiteCreateFormValues } from "@/types/sites";
import {
  isSiteCreateFormComplete,
  isSiteCreateSlugInvalid,
  siteCreateInput,
  siteCreateProductionBranch,
  withSiteRepository,
} from "@/utils/site-create";

export function SiteCreateForm({
  organizationId,
  organizationSlug,
  hostingDomain,
}: SiteCreateFormProps) {
  const t = useTranslations("sites.new");
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("sites.settings");
  const tSections = useTranslations("sites.sections");
  const tLayout = useTranslations("sites.layout");
  const id = useId();
  const visibilityOptions = useSitePreviewVisibilityOptions();
  const publishModeOptions = useSitePublishModeOptions();

  const repositoriesQuery = useQuery(
    dashboardOrpc.sites.repositories.queryOptions({
      input: { organizationId },
      enabled: organizationId.length > 0,
    })
  );
  const repositories = repositoriesQuery.data ?? [];

  const [form, setForm] = useState<SiteCreateFormValues>(
    SITE_CREATE_FORM_DEFAULTS
  );
  const update = <K extends keyof SiteCreateFormValues>(
    key: K,
    value: SiteCreateFormValues[K]
  ) => setForm((current) => ({ ...current, [key]: value }));

  const repository =
    repositories.find((candidate) => candidate.id === form.repositoryId) ??
    null;
  const slugInvalid = isSiteCreateSlugInvalid(form);
  const canSubmit =
    repository !== null && isSiteCreateFormComplete(form) && !slugInvalid;
  const { projectId } = useActiveProject();
  const createMutation = useCreateSite(organizationSlug);

  if (repositoriesQuery.isSuccess && repositories.length === 0) {
    return (
      <EmptyState
        action={
          <Link
            className={buttonVariants()}
            href={`/${organizationSlug}/integrations/github`}
          >
            <HugeiconsIcon className="size-4" icon={Github01Icon} />
            {t("noRepositories.action")}
          </Link>
        }
        description={t("noRepositories.description")}
        title={t("noRepositories.title")}
      />
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit && !createMutation.isPending) {
          createMutation.mutate(
            siteCreateInput(form, {
              organizationId,
              repositoryId: repository.id,
              projectId,
            })
          );
        }
      }}
    >
      <TitleCard as="section" heading={tSettings("general")} headingAs="h2">
        <div className="divide-border divide-y">
          <SiteSettingsRow
            description={
              <>
                {t("repositoryHint")}{" "}
                <Link
                  className="text-foreground underline-offset-4 hover:underline"
                  href={`/${organizationSlug}/integrations/github`}
                >
                  {t("manageRepositories")}
                </Link>
              </>
            }
            htmlFor={`${id}-repository`}
            label={tCommon("labels.repository")}
          >
            <SiteRepositorySelect
              id={`${id}-repository`}
              isLoading={repositoriesQuery.isPending}
              onSelect={(next) =>
                setForm((current) => withSiteRepository(current, next))
              }
              repositories={repositories}
              value={form.repositoryId}
            />
          </SiteSettingsRow>
          <SiteSettingsRow htmlFor={`${id}-name`} label={t("name")}>
            <Input
              autoComplete="off"
              id={`${id}-name`}
              maxLength={80}
              onChange={(event) => update("name", event.target.value)}
              placeholder={t("namePlaceholder")}
              required
              value={form.name}
            />
          </SiteSettingsRow>
          <SiteCreateSourceFields
            form={form}
            hostingDomain={hostingDomain}
            idPrefix={id}
            onChange={update}
            organizationId={organizationId}
            repository={repository}
            slugInvalid={slugInvalid}
          />
        </div>
      </TitleCard>

      <TitleCard as="section" heading={tSettings("content")} headingAs="h2">
        <div className="divide-border divide-y">
          <SiteSettingsRow
            description={tSections("pathHint")}
            label={tSections("title")}
          >
            <SiteSectionsFields
              blogEnabled={form.blogEnabled}
              blogPath={form.blogPath}
              changelogEnabled={form.changelogEnabled}
              changelogPath={form.changelogPath}
              hideTitle
              idPrefix={id}
              onBlogEnabledChange={(value) => update("blogEnabled", value)}
              onBlogPathChange={(value) => update("blogPath", value)}
              onChangelogEnabledChange={(value) =>
                update("changelogEnabled", value)
              }
              onChangelogPathChange={(value) => update("changelogPath", value)}
            />
          </SiteSettingsRow>
          <SiteSettingsRow
            description={tLayout("description")}
            label={tLayout("title")}
          >
            <SiteRepositoryLayout />
          </SiteSettingsRow>
        </div>
      </TitleCard>

      <TitleCard as="section" heading={tSettings("previews")} headingAs="h2">
        <div className="divide-border divide-y">
          <SiteSettingsRow label={t("previewVisibility")}>
            <SiteChoiceGroup
              hideLabel
              label={t("previewVisibility")}
              onValueChange={(value) => update("previewVisibility", value)}
              options={visibilityOptions}
              value={form.previewVisibility}
            />
          </SiteSettingsRow>
        </div>
      </TitleCard>

      <TitleCard as="section" heading={tSettings("publishing")} headingAs="h2">
        <div className="divide-border divide-y">
          <SiteSettingsRow label={t("publishMode")}>
            <SiteChoiceGroup
              hideLabel
              label={t("publishMode")}
              onValueChange={(value) => update("publishMode", value)}
              options={publishModeOptions}
              value={form.publishMode}
            />
          </SiteSettingsRow>
        </div>
      </TitleCard>

      <SiteCreateBar
        canSubmit={canSubmit}
        isCreating={createMutation.isPending}
        organizationSlug={organizationSlug}
        productionBranch={siteCreateProductionBranch(form, repository)}
      />
    </form>
  );
}
