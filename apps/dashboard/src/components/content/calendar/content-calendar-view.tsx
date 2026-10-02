"use client";

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { startOfDay } from "date-fns";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { ContentCalendarGrid } from "@/components/content/calendar/content-calendar-grid";
import { EmptyState } from "@/components/empty-state";
import { useActiveProject } from "@/lib/hooks/use-active-project";
import {
  useContentCalendar,
  useSchedulePost,
} from "@/lib/hooks/use-content-calendar";
import { useLocalDateFormat } from "@/lib/hooks/use-local-date-format";
import { dashboardOrpc } from "@/lib/orpc/query";
import { cn } from "@/lib/utils";
import type {
  CalendarDragPayload,
  ContentCalendarViewProps,
} from "@/types/content/calendar";
import {
  calendarDayKey,
  calendarEntryItems,
  getCalendarDays,
  getCalendarRange,
  groupCalendarItemsByDay,
  parseCalendarDayKey,
  projectAutomationRuns,
  scheduleDestinationsOf,
  shiftCalendarMonth,
} from "@/utils/content-calendar";
import { getLocalTimezone } from "@/utils/schedule-summary";

export function ContentCalendarView({
  organizationId,
  organizationSlug,
  toolbarEnd,
}: ContentCalendarViewProps) {
  const t = useTranslations("content.calendar");
  const tCommon = useTranslations("common.actions");
  const formatDate = useLocalDateFormat();
  const [anchorKey, setAnchorKey] = useQueryState("date", {
    clearOnDefault: true,
  });
  const anchor = useMemo(
    () => parseCalendarDayKey(anchorKey) ?? startOfDay(new Date()),
    [anchorKey]
  );

  const days = useMemo(() => getCalendarDays(anchor), [anchor]);
  const range = useMemo(() => getCalendarRange(days), [days]);
  const { data, isPending, isError, refetch } = useContentCalendar(
    organizationId,
    range
  );
  const { data: automation } = useQuery(
    dashboardOrpc.automation.schedules.list.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
      staleTime: 5 * 60 * 1000,
    })
  );
  const reschedule = useSchedulePost(organizationId);

  // Warm the neighbouring months so paging is instant.
  const queryClient = useQueryClient();
  const { projectId, isResolved } = useActiveProject();
  useEffect(() => {
    if (!(organizationId && isResolved)) {
      return;
    }
    for (const direction of [-1, 1] as const) {
      const neighbour = getCalendarRange(
        getCalendarDays(shiftCalendarMonth(anchor, direction))
      );
      void queryClient.prefetchQuery(
        dashboardOrpc.contentCalendar.list.queryOptions({
          input: {
            organizationId,
            projectId: projectId ?? undefined,
            from: neighbour.from.toISOString(),
            to: neighbour.to.toISOString(),
          },
          staleTime: 30_000,
        })
      );
    }
  }, [anchor, organizationId, projectId, isResolved, queryClient]);

  const itemsByDay = useMemo(
    () =>
      groupCalendarItemsByDay([
        ...calendarEntryItems(data?.entries ?? []),
        ...projectAutomationRuns(automation?.triggers ?? [], range),
      ]),
    [data?.entries, automation?.triggers, range]
  );

  const setAnchor = (date: Date) => {
    const key = calendarDayKey(date);
    void setAnchorKey(key === calendarDayKey(new Date()) ? null : key);
  };

  const handleDropPost = (payload: CalendarDragPayload, day: Date) => {
    // Moving keeps the time of day and every destination.
    const previous = new Date(payload.schedule.scheduledAt);
    const scheduledAt = new Date(day);
    scheduledAt.setHours(previous.getHours(), previous.getMinutes(), 0, 0);
    if (scheduledAt.getTime() < Date.now()) {
      toast.error(t("toasts.moveIntoPast"));
      return;
    }
    reschedule.mutate(
      {
        contentId: payload.postId,
        scheduledAt,
        // The new wall-clock time was picked in this browser's zone.
        timeZone: getLocalTimezone(),
        destinations: scheduleDestinationsOf(payload.schedule),
        expectedScheduledIds: payload.schedule.publications.map(
          (publication) => publication.id
        ),
      },
      {
        onSuccess: () => {
          toast.success(
            t("toasts.moved", {
              title: payload.title,
              date: formatDate(scheduledAt, {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              }),
            })
          );
        },
      }
    );
  };

  const heading = formatDate(anchor, { month: "long", year: "numeric" });

  return (
    <div className="space-y-3">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            aria-label={t("previous")}
            onClick={() => setAnchor(shiftCalendarMonth(anchor, -1))}
            size="icon-sm"
            variant="ghost"
          >
            <HugeiconsIcon className="size-4" icon={ArrowLeft01Icon} />
          </Button>
          <Button
            aria-label={t("next")}
            onClick={() => setAnchor(shiftCalendarMonth(anchor, 1))}
            size="icon-sm"
            variant="ghost"
          >
            <HugeiconsIcon className="size-4" icon={ArrowRight01Icon} />
          </Button>
          <h2 aria-live="polite" className="ml-1 text-sm font-medium">
            {heading}
          </h2>
          {anchorKey ? (
            <Button
              onClick={() => {
                void setAnchorKey(null);
              }}
              size="sm"
              variant="ghost"
            >
              {t("today")}
            </Button>
          ) : null}
        </div>
        {toolbarEnd}
      </div>

      {isError ? (
        <EmptyState
          action={
            <Button
              onClick={() => {
                void refetch();
              }}
              variant="outline"
            >
              {tCommon("tryAgain")}
            </Button>
          }
          description={t("loadFailedDescription")}
          title={t("loadFailedTitle")}
        />
      ) : (
        <div
          aria-busy={isPending}
          className={cn(
            "min-w-0 transition-opacity duration-150 ease-out",
            isPending && "opacity-60"
          )}
        >
          <ContentCalendarGrid
            days={days}
            itemsByDay={itemsByDay}
            month={anchor}
            onDropPost={handleDropPost}
            organizationSlug={organizationSlug}
          />
        </div>
      )}
    </div>
  );
}
