"use client";

import {
  Alert02Icon,
  Calendar03Icon,
  CalendarRemove01Icon,
  Loading03Icon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@notra/ui/components/ui/dropdown-menu";
import {
  SplitButton,
  SplitButtonTrigger,
} from "@notra/ui/components/ui/split-button";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/button";
import { ScheduleContentDialog } from "@/components/content/schedule/schedule-content-dialog";
import {
  SCHEDULE_DIALOG_MODES,
  SCHEDULE_SLOT_DATE_FORMAT,
} from "@/constants/content-calendar";
import {
  useCancelPostSchedule,
  usePostSchedule,
  usePublishScheduleNow,
} from "@/lib/hooks/use-content-calendar";
import { useLocalDateFormat } from "@/lib/hooks/use-local-date-format";
import { cn } from "@/lib/utils";
import type {
  ContentPublishButtonProps,
  ScheduleMenuItemLabelProps,
} from "@/types/content/schedule";
import {
  getScheduleDialogMode,
  summarizePostSchedule,
} from "@/utils/content-calendar";

/** A menu item's label, with the reason underneath while it is disabled. */
function MenuItemLabel({ label, hint }: ScheduleMenuItemLabelProps) {
  return (
    <span className="flex flex-col">
      <span>{label}</span>
      {hint ? (
        <span className="text-muted-foreground text-xs">{hint}</span>
      ) : null}
    </span>
  );
}

/**
 * Publish, with scheduling in its menu. Once a schedule is live it takes the
 * button's place, since publishing by hand would bypass its destinations; its
 * own menu publishes every destination now or drops the schedule.
 */
export function ContentPublishButton({
  organizationId,
  organizationSlug,
  contentId,
  contentType,
  title,
  hasUnsavedChanges,
  published,
  publishButton,
}: ContentPublishButtonProps) {
  const t = useTranslations("content.calendar.schedule");
  const formatDate = useLocalDateFormat();
  const [open, setOpen] = useState(false);
  const { data } = usePostSchedule(organizationId, contentId);
  const schedule = data?.schedule ?? null;
  const summary = summarizePostSchedule(schedule);
  const { state, active, failed } = summary;
  // A schedule still going out, or one with failures to resolve.
  const live = active || failed;
  const mode = SCHEDULE_DIALOG_MODES[getScheduleDialogMode(summary)];
  const cancel = useCancelPostSchedule(organizationId);
  const publishNow = usePublishScheduleNow(organizationId);
  const busy = cancel.isPending || publishNow.isPending;

  let icon = Calendar03Icon;
  let label = t("trigger");
  if (state === "publishing") {
    icon = Loading03Icon;
    label = t("publishingTrigger");
  } else if (failed) {
    icon = Alert02Icon;
    label = t("failedTrigger");
  } else if (state === "scheduled" && schedule) {
    label = t("scheduledTrigger", {
      date: formatDate(
        new Date(schedule.scheduledAt),
        SCHEDULE_SLOT_DATE_FORMAT
      ),
    });
  }

  let controls = publishButton;
  if (live) {
    const scheduleButton = (
      <Button onClick={() => setOpen(true)} size="sm" variant="outline">
        <HugeiconsIcon
          className={cn(
            "size-4",
            state === "publishing" && "animate-spin",
            failed && "text-destructive"
          )}
          icon={icon}
        />
        <span className="max-w-52 truncate">{label}</span>
      </Button>
    );
    const scheduleControls = mode.secondaryAction ? (
      <SplitButton>
        {scheduleButton}
        <DropdownMenu>
          <SplitButtonTrigger
            disabled={busy}
            label={t("moreActions")}
            size="sm"
            variant="outline"
          />
          <DropdownMenuContent align="end" className="w-56">
            {mode.canPublishNow ? (
              // A schedule sends the saved post, so unsaved edits wait.
              <DropdownMenuItem
                className={cn(hasUnsavedChanges && "items-start")}
                disabled={hasUnsavedChanges}
                onClick={() => publishNow.mutate(contentId)}
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  className={cn(hasUnsavedChanges && "mt-0.5")}
                  icon={SentIcon}
                />
                <MenuItemLabel
                  hint={hasUnsavedChanges ? t("saveFirstHint") : null}
                  label={t("publishNow")}
                />
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onClick={() => cancel.mutate(contentId)}
              variant="destructive"
            >
              <HugeiconsIcon aria-hidden="true" icon={CalendarRemove01Icon} />
              {t(mode.secondaryAction)}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SplitButton>
    ) : (
      scheduleButton
    );
    controls = published ? (
      <>
        {scheduleControls}
        {publishButton}
      </>
    ) : (
      scheduleControls
    );
  } else if (!published) {
    controls = (
      <SplitButton>
        {publishButton}
        <DropdownMenu>
          <SplitButtonTrigger label={t("moreActions")} size="sm" />
          <DropdownMenuContent align="end" className="w-56">
            {/* Unsaved edits would not be part of what goes out. */}
            <DropdownMenuItem
              className={cn(hasUnsavedChanges && "items-start")}
              disabled={hasUnsavedChanges}
              onClick={() => setOpen(true)}
            >
              <HugeiconsIcon
                aria-hidden="true"
                className={cn(hasUnsavedChanges && "mt-0.5")}
                icon={Calendar03Icon}
              />
              <MenuItemLabel
                hint={hasUnsavedChanges ? t("saveFirstHint") : null}
                label={t("trigger")}
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SplitButton>
    );
  }

  return (
    <>
      {controls}
      <ScheduleContentDialog
        contentId={contentId}
        contentType={contentType}
        hasUnsavedChanges={hasUnsavedChanges}
        onOpenChange={setOpen}
        open={open}
        organizationId={organizationId}
        organizationSlug={organizationSlug}
        schedule={schedule}
        title={title}
      />
    </>
  );
}
