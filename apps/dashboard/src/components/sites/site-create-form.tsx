"use client";

import {
  domAnimation,
  LazyMotion,
  m,
  MotionConfig,
  useReducedMotion,
} from "motion/react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { PageHeading } from "@/components/layout/page-heading";
import { SiteCreateDeploy } from "@/components/sites/site-create-deploy";
import { SiteCreateSourceFields } from "@/components/sites/site-create-source-fields";
import { SiteCreateStage } from "@/components/sites/site-create-stage";
import { SiteCreateStep } from "@/components/sites/site-create-step";
import { SiteCreateStepList } from "@/components/sites/site-create-step-list";
import { SiteImportList } from "@/components/sites/site-import-list";
import {
  SITE_CREATE_CONFIG_VARIANTS,
  SITE_CREATE_FIELD_INPUT_SUFFIXES,
  SITE_CREATE_FOCUS_DELAY_MS,
  SITE_CREATE_FORM_DEFAULTS,
  SITE_CREATE_STEP_IDS,
  SITE_CREATE_VALUE_FIELDS,
} from "@/constants/site-create";
import { useActiveProject } from "@/lib/hooks/use-active-project";
import { useCreateSite } from "@/lib/hooks/use-create-site";
import {
  useConnectSiteRepository,
  useImportableRepositories,
} from "@/lib/hooks/use-importable-repositories";
import type {
  SiteCreateFormProps,
  SiteCreateStepState,
} from "@/types/components/sites";
import type {
  SiteCreateFieldErrors,
  SiteCreateFormValues,
  SiteCreateStepId,
  SiteImportableRepository,
  SiteRepository,
} from "@/types/sites";
import { toErrorMessage } from "@/utils/error-message";
import {
  isSiteCreateReady,
  isSiteCreateSlugInvalid,
  siteCreateErrorField,
  siteCreateInput,
  withSiteRepository,
} from "@/utils/site-create";

/**
 * The new-site page, after Cloudflare's "Create an app": three step cards on
 * a stage that never scrolls. Importing a repository (connecting it on the
 * way) glides the settings into the middle, Create glides in the deploy log;
 * dimmed earlier cards and the step list lead back. Previews and publishing
 * start from their defaults and are changed later on the site.
 */
export function SiteCreateForm({
  organizationId,
  organizationSlug,
  hostingDomain,
}: SiteCreateFormProps) {
  const t = useTranslations("sites.new");
  const id = useId();
  const reduceMotion = useReducedMotion();

  const importable = useImportableRepositories(organizationId);
  const connect = useConnectSiteRepository(organizationId);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [repository, setRepository] = useState<SiteRepository | null>(null);
  const [activeStep, setActiveStep] = useState<SiteCreateStepId>("repository");
  const [form, setForm] = useState<SiteCreateFormValues>(
    SITE_CREATE_FORM_DEFAULTS
  );
  const [errors, setErrors] = useState<SiteCreateFieldErrors>({});
  // Kept across steps so the deploy card can point at it if notra.json is still missing.
  const [starterPullRequestUrl, setStarterPullRequestUrl] = useState<
    string | null
  >(null);

  const { projectId } = useActiveProject();
  const createMutation = useCreateSite();
  const isCreating = createMutation.isPending;
  const created = createMutation.data?.site ?? null;
  const isReady = isSiteCreateReady(form, repository);

  const stepIds = SITE_CREATE_STEP_IDS;
  const activeIndex = stepIds.indexOf(activeStep);
  const stateOf = (step: SiteCreateStepId): SiteCreateStepState => {
    const index = stepIds.indexOf(step);
    if (index === activeIndex) {
      return "active";
    }
    return index < activeIndex ? "done" : "locked";
  };

  const clearErrors = (fields: (keyof SiteCreateFieldErrors)[]) =>
    setErrors((current) => {
      const next = { ...current };
      for (const field of fields) {
        delete next[field];
      }
      return next;
    });

  const update = <K extends keyof SiteCreateFormValues>(
    key: K,
    value: SiteCreateFormValues[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    const field = SITE_CREATE_VALUE_FIELDS[key];
    if (field) {
      // An empty address follows the name, so renaming also retries the address.
      clearErrors(
        key === "name" && !form.slug.trim() ? [field, "slug"] : [field]
      );
    }
  };

  /** Moves to a step; the stage glides it into the middle, then focus follows. */
  const goTo = (step: SiteCreateStepId, focusId?: string) => {
    // Once the site exists the earlier steps are history, not settings.
    if (createMutation.isSuccess && step !== "deploy") {
      return;
    }
    setActiveStep(step);
    if (focusId) {
      window.setTimeout(
        () => document.getElementById(focusId)?.focus({ preventScroll: true }),
        reduceMotion ? 0 : SITE_CREATE_FOCUS_DELAY_MS
      );
    }
  };

  const importRepository = async (candidate: SiteImportableRepository) => {
    setImportingId(candidate.githubRepositoryId);
    try {
      const picked: SiteRepository = candidate.integrationId
        ? {
            id: candidate.integrationId,
            owner: candidate.owner,
            repo: candidate.repo,
            defaultBranch: candidate.defaultBranch,
            private: candidate.private,
          }
        : await connect.mutateAsync(candidate.githubRepositoryId);
      setRepository(picked);
      setStarterPullRequestUrl(null);
      setForm((current) =>
        withSiteRepository({ ...current, name: "", slug: "" }, picked)
      );
      clearErrors(["repository"]);
      goTo("configure", `${id}-name`);
    } catch (error) {
      toast.error(toErrorMessage(error, t("importFailed")));
    } finally {
      setImportingId(null);
    }
  };

  const create = () => {
    if (!(repository && isReady) || isCreating) {
      return;
    }
    createMutation.mutate(
      siteCreateInput(form, {
        organizationId,
        repositoryId: repository.id,
        projectId,
      }),
      {
        onSuccess: () => goTo("deploy"),
        onError: (error) => {
          const field = siteCreateErrorField(error);
          if (!field) {
            return;
          }
          setErrors({ [field]: error.message });
          if (field === "repository") {
            goTo("repository");
            return;
          }
          const suffix = SITE_CREATE_FIELD_INPUT_SUFFIXES[field];
          goTo("configure", suffix ? `${id}-${suffix}` : undefined);
        },
      }
    );
  };

  const steps = stepIds.map((step) => ({
    id: step,
    label: t(`stepLabels.${step}`),
    state:
      step === "configure" && !repository ? ("locked" as const) : stateOf(step),
  }));
  const sideTitle = {
    repository: {
      title: t("stepRepository"),
      description: t("stepRepositoryDescription"),
    },
    configure: {
      title: t("stepConfigure"),
      description: repository
        ? t("stepConfigureDescription", {
            repository: `${repository.owner}/${repository.repo}`,
          })
        : undefined,
    },
    deploy: {
      title: t("stepDeploy"),
      description: t("stepDeployDescription"),
    },
  }[activeStep];

  return (
    // Fills the panel: nothing on this page scrolls, the stage moves instead.
    <div className="flex min-h-0 flex-1 flex-col gap-6" data-site-fill>
      <PageHeading description={t("description")} title={t("title")} />
      <div className="flex min-h-[32rem] min-w-0 flex-1 flex-col">
        <SiteCreateStage
          activeIndex={activeIndex}
          left={
            // Keyed per step: the title swaps with a short fade as the card arrives.
            <div
              aria-hidden="true"
              className="animate-in fade-in motion-safe:slide-in-from-bottom-1 space-y-1.5 pt-1 duration-500"
              key={activeStep}
            >
              <p className="text-lg font-semibold tracking-tight">
                {sideTitle.title}
              </p>
              {sideTitle.description ? (
                <p className="text-muted-foreground text-sm text-pretty">
                  {sideTitle.description}
                </p>
              ) : null}
            </div>
          }
          right={
            <SiteCreateStepList
              onSelect={(step) => goTo(step as SiteCreateStepId)}
              steps={steps}
            />
          }
        >
          <SiteCreateStep
            description={t("stepRepositoryDescription")}
            onActivate={() => goTo("repository")}
            state={stateOf("repository")}
            title={t("stepRepository")}
          >
            <SiteImportList
              importingId={importingId}
              installed={importable.data?.installed ?? false}
              isLoading={importable.isPending}
              onImport={importRepository}
              organizationId={organizationId}
              organizationSlug={organizationSlug}
              repositories={importable.data?.repositories ?? []}
            />
            {errors.repository ? (
              <p className="text-destructive mt-3 text-sm" role="alert">
                {errors.repository}
              </p>
            ) : null}
          </SiteCreateStep>

          <SiteCreateStep
            description={
              repository
                ? t("stepConfigureDescription", {
                    repository: `${repository.owner}/${repository.repo}`,
                  })
                : undefined
            }
            footer={
              <Button
                disabled={!isReady}
                loading={isCreating}
                onClick={create}
                type="button"
              >
                {t("create")}
              </Button>
            }
            onActivate={() => goTo("configure", `${id}-name`)}
            state={repository ? stateOf("configure") : "locked"}
            title={t("stepConfigure")}
          >
            <MotionConfig reducedMotion="user">
              <LazyMotion features={domAnimation} strict>
                {/* Keyed per repository: each import replays the rows' entrance. */}
                <m.div
                  animate="shown"
                  className="space-y-4"
                  initial={repository ? "hidden" : false}
                  key={repository?.id ?? "locked"}
                  variants={SITE_CREATE_CONFIG_VARIANTS}
                >
                  <SiteCreateSourceFields
                    errors={errors}
                    form={form}
                    hostingDomain={hostingDomain}
                    idPrefix={id}
                    onChange={update}
                    onStarterPullRequestOpened={setStarterPullRequestUrl}
                    organizationId={organizationId}
                    repository={repository}
                    slugInvalid={isSiteCreateSlugInvalid(form)}
                    starterPullRequestUrl={starterPullRequestUrl}
                  />
                </m.div>
              </LazyMotion>
            </MotionConfig>
          </SiteCreateStep>

          <SiteCreateStep state={stateOf("deploy")} title={t("stepDeploy")}>
            {created ? (
              <SiteCreateDeploy
                deploymentQueued={createMutation.data?.deploymentQueued ?? true}
                organizationId={organizationId}
                organizationSlug={organizationSlug}
                site={created}
                starterPullRequestUrl={starterPullRequestUrl}
              />
            ) : (
              <div className="h-80" />
            )}
          </SiteCreateStep>
        </SiteCreateStage>
      </div>
    </div>
  );
}
