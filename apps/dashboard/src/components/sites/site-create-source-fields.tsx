"use client";

import { Folder01Icon, GitBranchIcon } from "@hugeicons/core-free-icons";
import { slugifySiteName } from "@notra/sites-core/utils/hosts";
import { useTranslations } from "next-intl";

import { SiteAddressInput } from "@/components/sites/site-address-input";
import { SiteSettingsRow } from "@/components/sites/site-settings-row";
import { SiteSuggestInput } from "@/components/sites/site-suggest-input";
import { useRepositorySuggestions } from "@/lib/hooks/use-repository-suggestions";
import type { SiteCreateSourceFieldsProps } from "@/types/components/sites";

/** Address, branch and root directory of a new site, with suggestions from its repository. */
export function SiteCreateSourceFields({
  idPrefix: id,
  organizationId,
  hostingDomain,
  form,
  onChange: update,
  repository,
  slugInvalid,
}: SiteCreateSourceFieldsProps) {
  const t = useTranslations("sites.new");
  const suggestions = useRepositorySuggestions({
    organizationId,
    repositoryId: form.repositoryId,
    branch: form.branch.trim(),
  });

  return (
    <>
      <SiteSettingsRow
        description={
          <span className={slugInvalid ? "text-destructive" : undefined}>
            {slugInvalid ? t("addressInvalid") : t("addressHint")}
          </span>
        }
        htmlFor={`${id}-slug`}
        label={t("address")}
      >
        <SiteAddressInput
          hostingDomain={hostingDomain}
          id={`${id}-slug`}
          invalid={slugInvalid}
          onValueChange={(value) => update("slug", value)}
          placeholder={slugifySiteName(form.name) || "acme"}
          value={form.slug}
        />
      </SiteSettingsRow>
      <SiteSettingsRow
        description={t("branchHint")}
        htmlFor={`${id}-branch`}
        label={t("branch")}
      >
        <SiteSuggestInput
          emptyLabel={t("noBranchMatch")}
          icon={GitBranchIcon}
          id={`${id}-branch`}
          onValueChange={(value) => update("branch", value)}
          placeholder={repository?.defaultBranch ?? "main"}
          suggestions={suggestions.branches}
          value={form.branch}
        />
      </SiteSettingsRow>
      <SiteSettingsRow
        description={t("rootDirectoryHint")}
        htmlFor={`${id}-root`}
        label={t("rootDirectory")}
      >
        <SiteSuggestInput
          emptyLabel={t("noDirectoryMatch")}
          icon={Folder01Icon}
          id={`${id}-root`}
          onValueChange={(value) => update("rootDirectory", value)}
          placeholder={t("rootDirectoryPlaceholder")}
          suggestions={suggestions.configDirectories.filter(Boolean)}
          value={form.rootDirectory}
        />
      </SiteSettingsRow>
    </>
  );
}
