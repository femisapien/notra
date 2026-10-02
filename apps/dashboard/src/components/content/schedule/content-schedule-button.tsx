"use client";

import {
  Alert02Icon,
  Calendar03Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/button";
import { ScheduleContentDialog } from "@/components/content/schedule/schedule-content-dialog";
import { usePostSchedule } from "@/lib/hooks/use-content-calendar";
import { useLocalDateFormat } from "@/lib/hooks/use-local-date-format";
import { cn } from "@/lib/utils";
import type { ContentScheduleButtonProps } from "@/types/content/schedule";
import { hasActiveSchedule } from "@/utils/content-calendar";

export function ContentScheduleButton({
  organizationId,
  organizationSlug,
  contentId,
  contentType,
  title,
  disabled,
  disabledReason,
  published,
}: ContentScheduleButtonProps) {
  const t = useTranslations("content.calendar.schedule");
  const formatDate = useLocalDateFormat();
  const [open, setOpen] = useState(false);
  const { data } = usePostSchedule(organizationId, contentId);
  const schedule = data?.schedule ?? null;
  const active = hasActiveSchedule(schedule);
  const publishing = Boolean(
    schedule?.publications.some(
      (publication) => publication.status === "publishing"
    )
  );
  const failed = Boolean(
    schedule?.publications.some(
      (publication) => publication.status === "failed"
    )
  );

  let icon = Calendar03Icon;
  let label = t("trigger");
  if (publishing) {
    icon = Loading03Icon;
    label = t("publishingTrigger");
  } else if (failed) {
    icon = Alert02Icon;
    label = t("failedTrigger");
  } else if (active && schedule) {
    label = t("scheduledTrigger", {
      date: formatDate(new Date(schedule.scheduledAt), {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }),
    });
  }

  if (published && !(active || failed || publishing)) {
    return null;
  }

  // Unsaved edits would not be part of what goes out, so they block the
  // dialog; an existing schedule stays reachable to cancel or inspect it.
  const blocked = Boolean(disabled) && !(active || failed);
  const button = (
    <Button
      disabled={blocked}
      onClick={() => setOpen(true)}
      size="sm"
      variant="outline"
    >
      <HugeiconsIcon
        className={cn(
          "size-4",
          publishing && "animate-spin",
          failed && "text-destructive"
        )}
        icon={icon}
      />
      <span className="max-w-52 truncate">{label}</span>
    </Button>
  );

  return (
    <>
      {blocked && disabledReason ? (
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            {button}
          </TooltipTrigger>
          <TooltipContent>{disabledReason}</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
      <ScheduleContentDialog
        contentId={contentId}
        contentType={contentType}
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
