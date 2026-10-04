"use client";

import { Label } from "@notra/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Switch } from "@notra/ui/components/ui/switch";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { type ReactNode, useId } from "react";

import { GitHubPublishRepositoryField } from "@/components/content/github-publish-repository-field";
import { ScheduleDestinationMark } from "@/components/content/schedule/schedule-destination-mark";
import type {
  ScheduleGitHubDestinationProps,
  ScheduleSocialDestinationProps,
  ScheduleWhereSectionProps,
} from "@/types/content/schedule";
import type { ConnectedAccount } from "@/types/hooks/connected-accounts";

function accountLabel(account: ConnectedAccount) {
  return `${account.displayName} · @${account.username}`;
}

function ScheduleGitHubDestination({
  fieldProps,
  enabled,
  merge,
  isBusy,
  organizationSlug,
  onEnabledChange,
  onMergeChange,
  onRepositoryChange,
}: ScheduleGitHubDestinationProps) {
  const t = useTranslations("content.calendar.schedule");
  const githubId = useId();
  const mergeId = useId();

  return (
    <li className="flex flex-col gap-3 px-3 py-2.5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-0.5">
          <Label htmlFor={githubId}>
            <ScheduleDestinationMark
              destination="github"
              socialPlatform={null}
            />
          </Label>
          <p className="text-muted-foreground pl-6 text-xs">
            {t("github.hint")}
          </p>
        </div>
        <Switch
          checked={enabled}
          id={githubId}
          onCheckedChange={onEnabledChange}
        />
      </div>
      {enabled ? (
        <div className="flex flex-col gap-3 pl-6">
          <GitHubPublishRepositoryField
            {...fieldProps}
            isPublishing={isBusy}
            onRepositoryChange={onRepositoryChange}
            organizationSlug={organizationSlug}
          />
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor={mergeId}>{t("github.merge")}</Label>
              <p className="text-muted-foreground text-xs">
                {merge ? t("github.mergeHint") : t("github.openOnlyHint")}
              </p>
            </div>
            <Switch
              checked={merge}
              id={mergeId}
              onCheckedChange={onMergeChange}
            />
          </div>
        </div>
      ) : null}
    </li>
  );
}

function ScheduleSocialDestination({
  option,
  organizationSlug,
  onEnabledChange,
  onAccountChange,
}: ScheduleSocialDestinationProps) {
  const t = useTranslations("content.calendar.schedule");
  const socialId = useId();
  const { accounts, selectedAccount, accountMissing, checked } = option;
  const showAccountPicker =
    checked && (accounts.length > 1 || (accountMissing && accounts.length > 0));

  let hint: ReactNode = t("social.hint");
  if (option.loadFailed) {
    hint = t("social.loadFailed");
  } else if (option.loaded && accounts.length === 0) {
    hint = t.rich("social.noAccounts", {
      link: (chunks) => (
        <Link
          className="underline underline-offset-4"
          href={`/${organizationSlug}/integrations`}
        >
          {chunks}
        </Link>
      ),
    });
  }

  return (
    <li className="flex flex-col gap-3 px-3 py-2.5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-0.5">
          <Label htmlFor={socialId}>
            <ScheduleDestinationMark
              destination="social"
              socialPlatform={option.platform}
            />
          </Label>
          <p className="text-muted-foreground pl-6 text-xs">{hint}</p>
        </div>
        <Switch
          checked={checked}
          disabled={!option.toggleable}
          id={socialId}
          onCheckedChange={onEnabledChange}
        />
      </div>
      {showAccountPicker ? (
        <div className="pl-6">
          <Select
            onValueChange={(value) => onAccountChange(value ?? "")}
            value={selectedAccount?.id ?? ""}
          >
            <SelectTrigger aria-label={t("social.account")} className="w-full">
              <SelectValue>
                {(value) => {
                  const account = accounts.find(
                    (candidate) => candidate.id === value
                  );
                  return account ? accountLabel(account) : t("social.account");
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {accountLabel(account)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {checked && accountMissing ? (
        <p className="text-destructive pl-6 text-xs" role="alert">
          {t("social.accountMissing")}
        </p>
      ) : null}
    </li>
  );
}

/** The "Where" section: Notra always, plus the destinations this type has. */
export function ScheduleWhereSection({
  destinations,
  form,
  isBusy,
  organizationSlug,
  onChange,
}: ScheduleWhereSectionProps) {
  const t = useTranslations("content.calendar.schedule");
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">{t("where")}</h3>
      <ul className="bg-card ring-foreground/10 divide-border divide-y rounded-xl ring-1">
        {/* Notra always publishes; the rest are opt-in. */}
        <li className="flex min-h-11 items-center justify-between gap-4 px-3 py-2.5">
          <ScheduleDestinationMark destination="notra" socialPlatform={null} />
          <span className="text-muted-foreground text-xs">{t("always")}</span>
        </li>
        {destinations.github ? (
          <ScheduleGitHubDestination
            enabled={form.githubEnabled}
            fieldProps={destinations.github}
            isBusy={isBusy}
            merge={form.merge}
            onEnabledChange={(githubEnabled) => onChange({ githubEnabled })}
            onMergeChange={(merge) => onChange({ merge })}
            onRepositoryChange={(repositoryId) => onChange({ repositoryId })}
            organizationSlug={organizationSlug}
          />
        ) : null}
        {destinations.social ? (
          <ScheduleSocialDestination
            onAccountChange={(accountId) => onChange({ accountId })}
            onEnabledChange={(socialEnabled) => onChange({ socialEnabled })}
            option={destinations.social}
            organizationSlug={organizationSlug}
          />
        ) : null}
      </ul>
    </section>
  );
}
