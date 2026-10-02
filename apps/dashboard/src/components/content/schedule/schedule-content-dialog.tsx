"use client";

import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ScheduleDestinationInput } from "@notra/schemas/dashboard/content-calendar";
import type { SocialConnectPlatform } from "@notra/schemas/dashboard/social-accounts";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@notra/ui/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Switch } from "@notra/ui/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { addDays, startOfDay } from "date-fns";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { type FormEvent, useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { Calendar } from "@/components/calendar";
import { GitHubPublishRepositoryField } from "@/components/content/github-publish-repository-field";
import { ScheduleDestinationStatusList } from "@/components/content/schedule/schedule-destination-status-list";
import { CONTENT_CALENDAR_DEFAULT_HOUR } from "@/constants/content-calendar";
import { SOCIAL_PLATFORM_LABELS } from "@/constants/social-connect";
import { useSocialAccounts } from "@/lib/hooks/use-connected-accounts";
import {
  useCancelPostSchedule,
  usePublishScheduleNow,
  useSchedulePost,
} from "@/lib/hooks/use-content-calendar";
import { useLocalDateFormat } from "@/lib/hooks/use-local-date-format";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { ScheduleContentDialogProps } from "@/types/content/schedule";
import {
  combineDateAndTime,
  hasActiveSchedule,
  isScheduleEditable,
  toTimeInputValue,
} from "@/utils/content-calendar";
import {
  getGitHubPublishRepositoryLists,
  isGitHubContentPublishingEnabled,
  resolveGitHubPublishRepositoryId,
} from "@/utils/github-publish-repositories";
import { readStoredGitHubPublishRepositoryId } from "@/utils/github-publish-repository-preference";
import { getLocalTimezone } from "@/utils/schedule-summary";

const SOCIAL_PLATFORM_BY_CONTENT_TYPE: Partial<
  Record<string, SocialConnectPlatform>
> = {
  twitter_post: "twitter",
  linkedin_post: "linkedin",
};

function initialSlot(
  scheduledAt: string | undefined,
  initialDate: Date | undefined
) {
  if (scheduledAt) {
    return new Date(scheduledAt);
  }
  const day = initialDate ?? addDays(new Date(), 1);
  const slot = startOfDay(day);
  slot.setHours(CONTENT_CALENDAR_DEFAULT_HOUR);
  return slot;
}

interface ScheduleFormState {
  date: Date | undefined;
  time: string;
  githubEnabled: boolean;
  repositoryId: string;
  merge: boolean;
  socialEnabled: boolean;
  accountId: string;
}

function initialFormState({
  organizationId,
  initialDate,
  schedule,
}: Pick<
  ScheduleContentDialogProps,
  "organizationId" | "initialDate" | "schedule"
>): ScheduleFormState {
  const active = hasActiveSchedule(schedule) ? schedule : null;
  const slot = initialSlot(active?.scheduledAt, initialDate);
  const github = active?.publications.find(
    (publication) => publication.destination === "github"
  );
  const social = active?.publications.find(
    (publication) => publication.destination === "social"
  );
  return {
    date: slot,
    time: toTimeInputValue(slot),
    githubEnabled: active ? Boolean(github) : false,
    repositoryId:
      github?.repositoryId ??
      readStoredGitHubPublishRepositoryId(organizationId) ??
      "",
    merge: github?.merge ?? true,
    socialEnabled: active ? Boolean(social) : true,
    accountId: social?.accountId ?? "",
  };
}

function ScheduleContentForm({
  onOpenChange,
  organizationId,
  organizationSlug,
  contentId,
  contentType,
  title,
  schedule,
  initialDate,
}: Omit<ScheduleContentDialogProps, "open">) {
  const t = useTranslations("content.calendar.schedule");
  const tCommon = useTranslations("common.actions");
  const formatDate = useLocalDateFormat();
  const dateId = useId();
  const timeId = useId();
  const githubId = useId();
  const mergeId = useId();
  const socialId = useId();
  const [form, setForm] = useState(() =>
    initialFormState({ organizationId, initialDate, schedule })
  );
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  // The server re-checks the slot, with a few minutes of grace for a dialog
  // that stayed open, so the open time is a close enough "now" here.
  const [openedAt] = useState(() => Date.now());
  const timeZone = getLocalTimezone();

  const scheduleMutation = useSchedulePost(organizationId);
  const cancelMutation = useCancelPostSchedule(organizationId);
  const publishNowMutation = usePublishScheduleNow(organizationId);

  const supportsGitHub =
    contentType === "changelog" || contentType === "blog_post";
  const socialPlatform = SOCIAL_PLATFORM_BY_CONTENT_TYPE[contentType];

  const integrationsQuery = useQuery(
    dashboardOrpc.integrations.list.queryOptions({
      input: { organizationId },
      enabled: supportsGitHub,
      staleTime: 5 * 60 * 1000,
    })
  );
  const { connected, publishable: repositories } =
    getGitHubPublishRepositoryLists(integrationsQuery.data?.integrations ?? []);
  const selectedRepositoryId = resolveGitHubPublishRepositoryId(
    form.repositoryId,
    repositories
  );
  const selectedRepository = repositories.find(
    (repository) => repository.id === selectedRepositoryId
  );
  const selectedPublishingEnabled =
    supportsGitHub && selectedRepository
      ? isGitHubContentPublishingEnabled(selectedRepository, contentType)
      : false;

  const { accounts: socialAccounts, isLoading: socialAccountsLoading } =
    useSocialAccounts(organizationId, socialPlatform ?? "twitter");
  const selectedAccount =
    socialAccounts.find((account) => account.id === form.accountId) ??
    socialAccounts[0];

  const active = hasActiveSchedule(schedule);
  const hasFailed = Boolean(
    schedule?.publications.some(
      (publication) => publication.status === "failed"
    )
  );
  // A schedule with failed destinations is resolved first (retry or clear),
  // so the dialog does not offer two competing actions at once.
  const editable = active ? isScheduleEditable(schedule) : !hasFailed;
  const showStatus = Boolean(
    schedule?.publications.some(
      (publication) => publication.status !== "scheduled"
    )
  );
  const scheduledAt =
    form.date && form.time
      ? combineDateAndTime(form.date, form.time)
      : undefined;
  const inPast = scheduledAt ? scheduledAt.getTime() < openedAt : false;

  const destinations: ScheduleDestinationInput[] = [];
  if (supportsGitHub && form.githubEnabled && selectedRepository) {
    destinations.push({
      destination: "github",
      repositoryId: selectedRepository.id,
      merge: form.merge,
    });
  }
  if (socialPlatform && form.socialEnabled && selectedAccount) {
    destinations.push({ destination: "social", accountId: selectedAccount.id });
  }
  const githubIncomplete =
    supportsGitHub &&
    form.githubEnabled &&
    !(selectedRepository && selectedPublishingEnabled);
  const isBusy =
    scheduleMutation.isPending ||
    cancelMutation.isPending ||
    publishNowMutation.isPending;
  const canSubmit =
    editable && Boolean(scheduledAt) && !inPast && !githubIncomplete && !isBusy;

  const update = (patch: Partial<ScheduleFormState>) =>
    setForm((current) => ({ ...current, ...patch }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!(canSubmit && scheduledAt)) {
      return;
    }
    scheduleMutation.mutate(
      {
        contentId,
        scheduledAt,
        timeZone,
        destinations,
        // Replace exactly the rows on screen; a stale view gets a conflict.
        expectedScheduledIds: schedule
          ? schedule.publications
              .filter((publication) => publication.status === "scheduled")
              .map((publication) => publication.id)
          : undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            t("scheduledToast", {
              date: formatDate(scheduledAt, {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              }),
            })
          );
          onOpenChange(false);
        },
      }
    );
  };

  let submitLabel = active ? t("saveSchedule") : t("schedule");
  if (scheduleMutation.isPending) {
    submitLabel = t("scheduling");
  }

  return (
    <form className="contents" onSubmit={handleSubmit}>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {editable ? (active ? t("editTitle") : t("title")) : t("statusTitle")}
        </ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          {editable
            ? t("description", { title })
            : t("statusDescription", { title })}
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <div className="min-w-0 space-y-6">
        {schedule && showStatus ? (
          <ScheduleDestinationStatusList
            contentId={contentId}
            organizationId={organizationId}
            schedule={schedule}
          />
        ) : null}

        {editable ? (
          <>
            <section className="space-y-3">
              <h3 className="text-sm font-medium">{t("when")}</h3>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1 space-y-2">
                  <Label
                    className="text-muted-foreground text-xs"
                    htmlFor={dateId}
                  >
                    {t("date")}
                  </Label>
                  <Popover
                    onOpenChange={setDatePickerOpen}
                    open={datePickerOpen}
                  >
                    <PopoverTrigger
                      render={
                        <Button
                          className="w-full justify-start gap-2 font-normal"
                          id={dateId}
                          type="button"
                          variant="outline"
                        />
                      }
                    >
                      <HugeiconsIcon
                        className="text-muted-foreground size-4"
                        icon={Calendar03Icon}
                      />
                      {form.date ? (
                        formatDate(form.date, {
                          weekday: "short",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      ) : (
                        <span className="text-muted-foreground">
                          {t("pickDate")}
                        </span>
                      )}
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-auto overflow-hidden p-0"
                      initialFocus={false}
                    >
                      <Calendar
                        defaultMonth={form.date}
                        disabled={{ before: startOfDay(new Date()) }}
                        mode="single"
                        onSelect={(date) => {
                          update({ date });
                          setDatePickerOpen(false);
                        }}
                        selected={form.date}
                        weekStartsOn={1}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label
                    className="text-muted-foreground text-xs"
                    htmlFor={timeId}
                  >
                    {t("time")}
                  </Label>
                  <Input
                    className="bg-background w-full appearance-none tabular-nums sm:w-32 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    id={timeId}
                    onChange={(event) => update({ time: event.target.value })}
                    required
                    type="time"
                    value={form.time}
                  />
                </div>
              </div>
              <p
                className={
                  inPast
                    ? "text-destructive text-xs"
                    : "text-muted-foreground text-xs"
                }
                role={inPast ? "alert" : undefined}
              >
                {inPast ? t("inPast") : t("timeZoneHint", { timeZone })}
              </p>
            </section>

            <section className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">{t("where")}</h3>
                <p className="text-muted-foreground text-xs">
                  {t("whereHint")}
                </p>
              </div>

              {supportsGitHub ? (
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor={githubId}>{t("github.label")}</Label>
                      <p className="text-muted-foreground text-xs">
                        {t("github.hint")}
                      </p>
                    </div>
                    <Switch
                      checked={form.githubEnabled}
                      id={githubId}
                      onCheckedChange={(githubEnabled) =>
                        update({ githubEnabled })
                      }
                    />
                  </div>
                  {form.githubEnabled ? (
                    <>
                      <GitHubPublishRepositoryField
                        connectedRepositoryCount={connected.length}
                        contentLabel={
                          contentType === "changelog"
                            ? "changelog"
                            : "blog post"
                        }
                        integrationsLoadFailed={
                          integrationsQuery.isError && !integrationsQuery.data
                        }
                        isLoadingIntegrations={integrationsQuery.isLoading}
                        isPublishing={isBusy}
                        onRepositoryChange={(repositoryId) =>
                          update({ repositoryId })
                        }
                        onRetryIntegrations={() => integrationsQuery.refetch()}
                        organizationSlug={organizationSlug}
                        repositories={repositories}
                        selectedPublishingEnabled={selectedPublishingEnabled}
                        selectedRepository={selectedRepository}
                      />
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <Label htmlFor={mergeId}>{t("github.merge")}</Label>
                          <p className="text-muted-foreground text-xs">
                            {form.merge
                              ? t("github.mergeHint")
                              : t("github.openOnlyHint")}
                          </p>
                        </div>
                        <Switch
                          checked={form.merge}
                          id={mergeId}
                          onCheckedChange={(merge) => update({ merge })}
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}

              {socialPlatform ? (
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor={socialId}>
                        {t("social.label", {
                          platform: SOCIAL_PLATFORM_LABELS[socialPlatform],
                        })}
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        {socialAccounts.length === 0 && !socialAccountsLoading
                          ? t.rich("social.noAccounts", {
                              link: (chunks) => (
                                <Link
                                  className="underline underline-offset-4"
                                  href={`/${organizationSlug}/integrations`}
                                >
                                  {chunks}
                                </Link>
                              ),
                            })
                          : t("social.hint")}
                      </p>
                    </div>
                    <Switch
                      checked={form.socialEnabled && socialAccounts.length > 0}
                      disabled={socialAccounts.length === 0}
                      id={socialId}
                      onCheckedChange={(socialEnabled) =>
                        update({ socialEnabled })
                      }
                    />
                  </div>
                  {form.socialEnabled && socialAccounts.length > 1 ? (
                    <Select
                      onValueChange={(value) =>
                        update({ accountId: value ?? "" })
                      }
                      value={selectedAccount?.id ?? ""}
                    >
                      <SelectTrigger
                        aria-label={t("social.account")}
                        className="w-full"
                      >
                        <SelectValue>
                          {(value) => {
                            const account = socialAccounts.find(
                              (candidate) => candidate.id === value
                            );
                            return account
                              ? `${account.displayName} · @${account.username}`
                              : t("social.account");
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {socialAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.displayName} · @{account.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
              ) : null}

              <p className="text-muted-foreground text-xs">
                {t("notraAlways")}
              </p>
            </section>

            {schedule && active ? (
              <p className="text-muted-foreground text-xs">
                {t("currentSlot", {
                  date: formatDate(new Date(schedule.scheduledAt), {
                    dateStyle: "full",
                    timeStyle: "short",
                  }),
                })}
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      <ResponsiveDialogFooter className="sm:justify-between">
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {active || hasFailed ? (
            <Button
              disabled={isBusy}
              onClick={() =>
                cancelMutation.mutate(contentId, {
                  onSuccess: () => onOpenChange(false),
                })
              }
              type="button"
              variant="ghost"
            >
              {active ? t("unschedule") : t("dismiss")}
            </Button>
          ) : null}
          {active && editable ? (
            <Button
              disabled={isBusy}
              onClick={() =>
                publishNowMutation.mutate(contentId, {
                  onSuccess: () => onOpenChange(false),
                })
              }
              type="button"
              variant="outline"
            >
              {t("publishNow")}
            </Button>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <ResponsiveDialogClose
            disabled={isBusy}
            render={<Button type="button" variant="outline" />}
          >
            {editable ? tCommon("cancel") : tCommon("close")}
          </ResponsiveDialogClose>
          {editable ? (
            <Button disabled={!canSubmit} type="submit">
              {submitLabel}
            </Button>
          ) : null}
        </div>
      </ResponsiveDialogFooter>
    </form>
  );
}

export function ScheduleContentDialog({
  open,
  onOpenChange,
  ...props
}: ScheduleContentDialogProps) {
  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="min-w-0 sm:max-w-[560px]">
        {/* Remount per open so the form starts from the current schedule. */}
        {open ? (
          <ScheduleContentForm onOpenChange={onOpenChange} {...props} />
        ) : null}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
