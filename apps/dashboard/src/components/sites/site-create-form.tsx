"use client";

import {
  File02Icon,
  Folder01Icon,
  GitBranchIcon,
  Github01Icon,
  SquareLock02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  isValidSiteSlug,
  slugifySiteName,
} from "@notra/sites-core/utils/hosts";
import { Input } from "@notra/ui/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@notra/ui/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import {
  SiteChoiceGroup,
  SiteSectionsFields,
} from "@/components/sites/site-form-fields";
import { SiteSettingsRow } from "@/components/sites/site-settings-row";
import { SiteSuggestInput } from "@/components/sites/site-suggest-input";
import {
  SITE_DEFAULT_BLOG_PATH,
  SITE_DEFAULT_CHANGELOG_PATH,
  SITE_REPOSITORY_LAYOUT,
} from "@/constants/sites";
import { useActiveProject } from "@/lib/hooks/use-active-project";
import { useRepositorySuggestions } from "@/lib/hooks/use-repository-suggestions";
import {
  useSitePreviewVisibilityOptions,
  useSitePublishModeOptions,
} from "@/lib/hooks/use-site-choice-options";
import { useInvalidateSites } from "@/lib/hooks/use-sites";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { SiteCreateFormProps } from "@/types/components/sites";
import type {
  SitePreviewVisibility,
  SitePublishMode,
  SiteRepository,
} from "@/types/sites";
import { toErrorMessage } from "@/utils/error-message";

function repositoryLabel(repository: SiteRepository): string {
  return `${repository.owner ?? ""}/${repository.repo ?? ""}`;
}

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
  const router = useRouter();
  const invalidateSites = useInvalidateSites();
  const visibilityOptions = useSitePreviewVisibilityOptions();
  const publishModeOptions = useSitePublishModeOptions();

  const repositoriesQuery = useQuery(
    dashboardOrpc.sites.repositories.queryOptions({
      input: { organizationId },
      enabled: organizationId.length > 0,
    })
  );
  const repositories = repositoriesQuery.data ?? [];

  const [repositoryId, setRepositoryId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [branch, setBranch] = useState("");
  const [rootDirectory, setRootDirectory] = useState("");
  const [blogEnabled, setBlogEnabled] = useState(true);
  const [changelogEnabled, setChangelogEnabled] = useState(true);
  const [blogPath, setBlogPath] = useState(SITE_DEFAULT_BLOG_PATH);
  const [changelogPath, setChangelogPath] = useState(
    SITE_DEFAULT_CHANGELOG_PATH
  );
  const [previewVisibility, setPreviewVisibility] =
    useState<SitePreviewVisibility>("protected");
  const [publishMode, setPublishMode] =
    useState<SitePublishMode>("pull_request");

  const repository =
    repositories.find((candidate) => candidate.id === repositoryId) ?? null;
  const trimmedSlug = slug.trim().toLowerCase();
  const slugInvalid = trimmedSlug.length > 0 && !isValidSiteSlug(trimmedSlug);
  const derivedSlug = slugifySiteName(name);
  const sectionsValid = blogEnabled || changelogEnabled;
  const canSubmit =
    repository !== null &&
    name.trim().length > 0 &&
    !slugInvalid &&
    sectionsValid;

  const suggestions = useRepositorySuggestions({
    organizationId,
    repositoryId,
    branch: branch.trim(),
  });
  const { projectId } = useActiveProject();
  const createMutation = useMutation({
    mutationFn: () => {
      if (!repository) {
        throw new Error(t("repositoryRequired"));
      }
      return dashboardOrpc.sites.create.call({
        organizationId,
        name: name.trim(),
        slug: trimmedSlug || undefined,
        repositoryId: repository.id,
        productionBranch: branch.trim() || undefined,
        rootDirectory: rootDirectory.trim() || undefined,
        mounts: {
          blog: blogEnabled ? blogPath : undefined,
          changelog: changelogEnabled ? changelogPath : undefined,
        },
        previewVisibility,
        publishMode,
        projectId: projectId ?? undefined,
      });
    },
    onSuccess: async (result) => {
      toast.success(
        result.deploymentQueued ? t("createdDeploying") : t("created")
      );
      await invalidateSites();
      router.push(`/${organizationSlug}/sites/${result.site.id}`);
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, t("createFailed")));
    },
  });

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

  const productionBranch = branch.trim() || repository?.defaultBranch || "";

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit && !createMutation.isPending) {
          createMutation.mutate();
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
            <Select
              disabled={repositoriesQuery.isPending}
              items={repositories.map((candidate) => ({
                value: candidate.id,
                label: repositoryLabel(candidate),
              }))}
              onValueChange={(value) => {
                const next = repositories.find((item) => item.id === value);
                if (!next) {
                  return;
                }
                setRepositoryId(next.id);
                setBranch(next.defaultBranch ?? "");
                if (!name.trim()) {
                  setName(next.repo ?? "");
                }
              }}
              value={repositoryId}
            >
              <SelectTrigger className="w-full" id={`${id}-repository`}>
                <SelectValue
                  placeholder={
                    repositoriesQuery.isPending
                      ? tCommon("labels.loading")
                      : t("repositoryPlaceholder")
                  }
                />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {repositories.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    <HugeiconsIcon
                      aria-hidden="true"
                      className="text-muted-foreground"
                      icon={Github01Icon}
                      size={14}
                    />
                    <span className="truncate">
                      {repositoryLabel(candidate)}
                    </span>
                    {candidate.private ? (
                      <HugeiconsIcon
                        aria-label={t("private")}
                        className="text-muted-foreground"
                        icon={SquareLock02Icon}
                        size={12}
                      />
                    ) : null}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SiteSettingsRow>
          <SiteSettingsRow htmlFor={`${id}-name`} label={t("name")}>
            <Input
              autoComplete="off"
              id={`${id}-name`}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("namePlaceholder")}
              required
              value={name}
            />
          </SiteSettingsRow>
          <SiteSettingsRow
            description={
              <span className={slugInvalid ? "text-destructive" : undefined}>
                {slugInvalid ? t("addressInvalid") : t("addressHint")}
              </span>
            }
            htmlFor={`${id}-slug`}
            label={t("address")}
          >
            <InputGroup>
              <InputGroupInput
                aria-invalid={slugInvalid || undefined}
                autoCapitalize="none"
                autoComplete="off"
                id={`${id}-slug`}
                maxLength={40}
                onChange={(event) => setSlug(event.target.value)}
                placeholder={derivedSlug || "acme"}
                spellCheck={false}
                value={slug}
              />
              {hostingDomain ? (
                <InputGroupAddon align="inline-end">
                  <InputGroupText>.{hostingDomain}</InputGroupText>
                </InputGroupAddon>
              ) : null}
            </InputGroup>
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
              onValueChange={setBranch}
              placeholder={repository?.defaultBranch ?? "main"}
              suggestions={suggestions.branches}
              value={branch}
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
              onValueChange={setRootDirectory}
              placeholder={t("rootDirectoryPlaceholder")}
              suggestions={suggestions.configDirectories.filter(Boolean)}
              value={rootDirectory}
            />
          </SiteSettingsRow>
        </div>
      </TitleCard>

      <TitleCard as="section" heading={tSettings("content")} headingAs="h2">
        <div className="divide-border divide-y">
          <SiteSettingsRow
            description={tSections("pathHint")}
            label={tSections("title")}
          >
            <SiteSectionsFields
              blogEnabled={blogEnabled}
              blogPath={blogPath}
              changelogEnabled={changelogEnabled}
              changelogPath={changelogPath}
              hideTitle
              idPrefix={id}
              onBlogEnabledChange={setBlogEnabled}
              onBlogPathChange={setBlogPath}
              onChangelogEnabledChange={setChangelogEnabled}
              onChangelogPathChange={setChangelogPath}
            />
          </SiteSettingsRow>
          <SiteSettingsRow
            description={tLayout("description")}
            label={tLayout("title")}
          >
            <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:pt-1.5">
              {SITE_REPOSITORY_LAYOUT.map((entry) => (
                <li
                  className="flex min-w-0 items-start gap-2.5"
                  key={entry.key}
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    className="text-muted-foreground mt-0.5 shrink-0"
                    icon={entry.path.includes("/") ? Folder01Icon : File02Icon}
                    size={15}
                  />
                  <span className="min-w-0">
                    <span className="block font-mono text-xs">
                      {entry.path}
                    </span>
                    <span className="text-muted-foreground block text-xs">
                      {tLayout(entry.key)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </SiteSettingsRow>
        </div>
      </TitleCard>

      <TitleCard as="section" heading={tSettings("previews")} headingAs="h2">
        <div className="divide-border divide-y">
          <SiteSettingsRow label={t("previewVisibility")}>
            <SiteChoiceGroup
              hideLabel
              label={t("previewVisibility")}
              onValueChange={setPreviewVisibility}
              options={visibilityOptions}
              value={previewVisibility}
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
              onValueChange={setPublishMode}
              options={publishModeOptions}
              value={publishMode}
            />
          </SiteSettingsRow>
        </div>
      </TitleCard>

      <div className="bg-background/90 sticky bottom-4 z-10 mx-auto flex w-fit items-center gap-1 rounded-xl border p-1 pl-3 shadow-lg backdrop-blur">
        <p className="text-muted-foreground mr-2 text-sm whitespace-nowrap">
          {repository && productionBranch
            ? t("barHint", { branch: productionBranch })
            : t("barHintNoRepository")}
        </p>
        <Link
          className={buttonVariants({ size: "sm", variant: "ghost" })}
          href={`/${organizationSlug}/sites`}
        >
          {tCommon("actions.cancel")}
        </Link>
        <Button
          disabled={!canSubmit}
          loading={createMutation.isPending}
          size="sm"
          type="submit"
        >
          {t("create")}
        </Button>
      </div>
    </form>
  );
}
