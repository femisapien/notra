"use client";

import type {
  ContentCalendarResponse,
  PostSchedule,
  PostScheduleResponse,
  ScheduleDestinationInput,
} from "@notra/schemas/dashboard/content-calendar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import {
  CONTENT_CALENDAR_ACTIVE_POLL_MS,
  POST_SCHEDULE_ACTIVE_POLL_MS,
  POST_SCHEDULE_IDLE_POLL_MS,
  POST_SCHEDULE_IMMINENT_WINDOW_MS,
} from "@/constants/content-calendar";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { ContentCalendarRange } from "@/types/content/calendar";

import { useActiveProject } from "./use-active-project";

/** Poll interval for a schedule: fast near its slot, slow while pending. */
function schedulePollInterval(schedule: PostSchedule | null | undefined) {
  if (hasPendingWork(schedule)) {
    return POST_SCHEDULE_ACTIVE_POLL_MS;
  }
  // TanStack evaluates this only after a fetch, so a page left open must
  // keep polling to notice the slot approaching.
  return schedule?.publications.some(
    (publication) => publication.status === "scheduled"
  )
    ? POST_SCHEDULE_IDLE_POLL_MS
    : false;
}

function hasPendingWork(schedule: PostSchedule | null | undefined) {
  if (!schedule) {
    return false;
  }
  return schedule.publications.some(
    (publication) =>
      publication.status === "publishing" ||
      (publication.status === "scheduled" &&
        Date.parse(publication.scheduledAt) - Date.now() <
          POST_SCHEDULE_IMMINENT_WINDOW_MS)
  );
}

export function useContentCalendar(
  organizationId: string,
  range: ContentCalendarRange
) {
  const tToast = useTranslations("content.calendar.toasts");
  const { projectId, isResolved } = useActiveProject();
  return useQuery<ContentCalendarResponse>({
    ...dashboardOrpc.contentCalendar.list.queryOptions({
      input: {
        organizationId,
        projectId: projectId ?? undefined,
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
    }),
    enabled: !!organizationId && isResolved,
    placeholderData: (previous) => previous,
    refetchInterval: (query) => {
      const schedules = (query.state.data?.entries ?? []).flatMap((entry) =>
        entry.kind === "scheduled" ? [entry.schedule] : []
      );
      if (schedules.some(hasPendingWork)) {
        return CONTENT_CALENDAR_ACTIVE_POLL_MS;
      }
      return schedules.some((schedule) => schedulePollInterval(schedule))
        ? POST_SCHEDULE_IDLE_POLL_MS
        : false;
    },
    meta: { errorMessage: tToast("loadFailed") },
  });
}

export function usePostSchedule(organizationId: string, contentId: string) {
  const queryClient = useQueryClient();
  const query = useQuery<PostScheduleResponse>({
    ...dashboardOrpc.contentCalendar.get.queryOptions({
      input: { organizationId, contentId },
    }),
    enabled: !!organizationId && !!contentId,
    refetchInterval: (current) =>
      schedulePollInterval(current.state.data?.schedule),
  });

  // A destination that just went out changed the post (status, PR link) on
  // the server; refresh what the page shows about it.
  const publishedIds =
    query.data?.schedule?.publications
      .filter((publication) => publication.status === "published")
      .map((publication) => publication.id)
      .join(",") ?? "";
  const seenPublishedIds = useRef(publishedIds);
  useEffect(() => {
    if (publishedIds === seenPublishedIds.current) {
      return;
    }
    seenPublishedIds.current = publishedIds;
    if (!publishedIds) {
      return;
    }
    // Status, PR link, recent-posts badges and collection counts all read
    // from the content queries.
    queryClient.invalidateQueries({ queryKey: dashboardOrpc.content.key() });
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.contentCalendar.list.key(),
    });
  }, [publishedIds, queryClient]);

  return query;
}

function useScheduleCacheUpdate(organizationId: string) {
  const queryClient = useQueryClient();
  return (contentId: string, schedule: PostSchedule | null) => {
    queryClient.setQueryData<PostScheduleResponse>(
      dashboardOrpc.contentCalendar.get.queryKey({
        input: { organizationId, contentId },
      }),
      { schedule }
    );
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.contentCalendar.list.key(),
    });
    // "Publish now" and retries flip the post to published within seconds.
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.content.get.queryKey({
        input: { organizationId, contentId },
      }),
    });
  };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useSchedulePost(organizationId: string) {
  const t = useTranslations("content.calendar.toasts");
  const updateCache = useScheduleCacheUpdate(organizationId);
  return useMutation({
    mutationFn: (input: {
      contentId: string;
      scheduledAt: Date;
      timeZone: string;
      destinations: ScheduleDestinationInput[];
      expectedScheduledIds?: string[];
    }) =>
      dashboardOrpc.contentCalendar.schedule.call({
        organizationId,
        contentId: input.contentId,
        scheduledAt: input.scheduledAt.toISOString(),
        timeZone: input.timeZone,
        destinations: input.destinations,
        expectedScheduledIds: input.expectedScheduledIds,
      }),
    onSuccess: (result, input) => {
      updateCache(input.contentId, result.schedule);
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("scheduleFailed")));
    },
  });
}

export function useCancelPostSchedule(organizationId: string) {
  const t = useTranslations("content.calendar.toasts");
  const updateCache = useScheduleCacheUpdate(organizationId);
  return useMutation({
    mutationFn: (contentId: string) =>
      dashboardOrpc.contentCalendar.cancel.call({ organizationId, contentId }),
    onSuccess: (result, contentId) => {
      updateCache(contentId, result.schedule);
      toast.success(
        result.inProgress ? t("unscheduledPartially") : t("unscheduled")
      );
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("unscheduleFailed")));
    },
  });
}

export function usePublishScheduleNow(organizationId: string) {
  const t = useTranslations("content.calendar.toasts");
  const updateCache = useScheduleCacheUpdate(organizationId);
  return useMutation({
    mutationFn: (contentId: string) =>
      dashboardOrpc.contentCalendar.publishNow.call({
        organizationId,
        contentId,
      }),
    onSuccess: (result, contentId) => {
      updateCache(contentId, result.schedule);
      toast.success(t("publishingNow"));
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("publishNowFailed")));
    },
  });
}

export function useRetryScheduledPublication(organizationId: string) {
  const t = useTranslations("content.calendar.toasts");
  const updateCache = useScheduleCacheUpdate(organizationId);
  return useMutation({
    mutationFn: (input: {
      contentId: string;
      scheduledPublicationId: string;
    }) =>
      dashboardOrpc.contentCalendar.retry.call({
        organizationId,
        scheduledPublicationId: input.scheduledPublicationId,
      }),
    onSuccess: (result, input) => {
      updateCache(input.contentId, result.schedule);
      toast.success(t("retrying"));
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("retryFailed")));
    },
  });
}
