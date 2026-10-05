"use client";

import { Folder01Icon, GitBranchIcon } from "@hugeicons/core-free-icons";
import { slugifySiteName } from "@notra/sites-core/utils/hosts";
import { Field, FieldError, FieldLabel } from "@notra/ui/components/ui/field";
import { Input } from "@notra/ui/components/ui/input";
import { m } from "motion/react";
import { useTranslations } from "next-intl";

import { SiteAddressInput } from "@/components/sites/site-address-input";
import { SiteCreateSections } from "@/components/sites/site-create-sections";
import { SiteCreateStarter } from "@/components/sites/site-create-starter";
import { SiteSuggestInput } from "@/components/sites/site-suggest-input";
import { SITE_CREATE_ROW_VARIANTS } from "@/constants/site-create";
import { useRepositorySuggestions } from "@/lib/hooks/use-repository-suggestions";
import type { SiteCreateSourceFieldsProps } from "@/types/components/sites";

/**
 * The configure step: name and address, branch and folder, and sections.
 * Each row rises in after the one above it.
 */
export function SiteCreateSourceFields({
  idPrefix: id,
  organizationId,
  hostingDomain,
  form,
  onChange: update,
  repository,
  slugInvalid,
  errors,
  starterPullRequestUrl,
  onStarterPullRequestOpened,
}: SiteCreateSourceFieldsProps) {
  const t = useTranslations("sites.new");
  const tSections = useTranslations("sites.sections");
  const suggestions = useRepositorySuggestions({
    organizationId,
    repositoryId: form.repositoryId,
    branch: form.branch.trim(),
  });
  const slugMessage = errors.slug ?? (slugInvalid ? t("addressInvalid") : null);

  return (
    <>
      <m.div
        className="grid gap-4 sm:grid-cols-2"
        variants={SITE_CREATE_ROW_VARIANTS}
      >
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor={`${id}-name`}>{t("name")}</FieldLabel>
          <Input
            aria-describedby={errors.name ? `${id}-name-error` : undefined}
            aria-invalid={errors.name ? true : undefined}
            autoComplete="off"
            id={`${id}-name`}
            maxLength={80}
            onChange={(event) => update("name", event.target.value)}
            placeholder={t("namePlaceholder")}
            required
            value={form.name}
          />
          <FieldError id={`${id}-name-error`}>{errors.name}</FieldError>
        </Field>
        <Field data-invalid={slugMessage ? true : undefined}>
          <FieldLabel htmlFor={`${id}-slug`}>{t("address")}</FieldLabel>
          <SiteAddressInput
            describedBy={`${id}-slug-hint`}
            hostingDomain={hostingDomain}
            id={`${id}-slug`}
            invalid={Boolean(slugMessage)}
            onValueChange={(value) => update("slug", value)}
            placeholder={slugifySiteName(form.name) || "acme"}
            value={form.slug}
          />
          <FieldError id={`${id}-slug-hint`}>{slugMessage}</FieldError>
        </Field>
      </m.div>
      <m.div
        className="grid gap-4 sm:grid-cols-2"
        variants={SITE_CREATE_ROW_VARIANTS}
      >
        <Field>
          <FieldLabel htmlFor={`${id}-branch`}>{t("branch")}</FieldLabel>
          <SiteSuggestInput
            emptyLabel={t("noBranchMatch")}
            icon={GitBranchIcon}
            id={`${id}-branch`}
            onValueChange={(value) => update("branch", value)}
            placeholder={repository?.defaultBranch ?? "main"}
            suggestions={suggestions.branches}
            value={form.branch}
          />
        </Field>
        <Field data-invalid={errors.rootDirectory ? true : undefined}>
          <FieldLabel htmlFor={`${id}-root`}>
            {t("rootDirectory")}
            <span className="text-muted-foreground font-normal">
              {t("optional")}
            </span>
          </FieldLabel>
          <SiteSuggestInput
            describedBy={errors.rootDirectory ? `${id}-root-error` : undefined}
            emptyLabel={t("noDirectoryMatch")}
            icon={Folder01Icon}
            id={`${id}-root`}
            invalid={Boolean(errors.rootDirectory)}
            onValueChange={(value) => update("rootDirectory", value)}
            placeholder={t("rootDirectoryPlaceholder")}
            suggestions={suggestions.configDirectories.filter(Boolean)}
            value={form.rootDirectory}
          />
          <FieldError id={`${id}-root-error`}>
            {errors.rootDirectory}
          </FieldError>
        </Field>
      </m.div>
      {form.repositoryId ? (
        <SiteCreateStarter
          branch={form.branch}
          onPullRequestOpened={onStarterPullRequestOpened}
          organizationId={organizationId}
          pullRequestUrl={starterPullRequestUrl}
          repositoryId={form.repositoryId}
          rootDirectory={form.rootDirectory}
        />
      ) : null}
      <m.div variants={SITE_CREATE_ROW_VARIANTS}>
        <SiteCreateSections
          error={errors.sections}
          idPrefix={id}
          sections={[
            {
              key: "blog",
              title: tSections("blog"),
              enabled: form.blogEnabled,
              path: form.blogPath,
              onEnabledChange: (value) => update("blogEnabled", value),
              onPathChange: (value) => update("blogPath", value),
            },
            {
              key: "changelog",
              title: tSections("changelog"),
              enabled: form.changelogEnabled,
              path: form.changelogPath,
              onEnabledChange: (value) => update("changelogEnabled", value),
              onPathChange: (value) => update("changelogPath", value),
            },
          ]}
        />
      </m.div>
    </>
  );
}
