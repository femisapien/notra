import type {
  ContentCalendarEntry,
  PostSchedule,
  ScheduleDestinationInput,
} from "@notra/schemas/dashboard/content-calendar";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import {
  CONTENT_CALENDAR_MAX_PROJECTED_RUNS,
  CONTENT_CALENDAR_WEEK_STARTS_ON,
} from "@/constants/content-calendar";
import type {
  CalendarEntryState,
  CalendarItem,
  ContentCalendarRange,
} from "@/types/content/calendar";
import type { Trigger } from "@/types/triggers/triggers";
import { computeNextRun } from "@/utils/schedule-summary";

const weekOptions = { weekStartsOn: CONTENT_CALENDAR_WEEK_STARTS_ON } as const;

/** The visible days of a month grid: whole weeks around the month. */
export function getCalendarDays(anchor: Date) {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(anchor), weekOptions),
    end: endOfWeek(endOfMonth(anchor), weekOptions),
  });
}

/** `[first visible day, day after the last)` in local time. */
export function getCalendarRange(days: Date[]): ContentCalendarRange {
  const first = days.at(0) ?? new Date();
  const last = days.at(-1) ?? first;
  return { from: first, to: addDays(last, 1) };
}

export function shiftCalendarMonth(anchor: Date, direction: 1 | -1) {
  return addMonths(startOfMonth(anchor), direction);
}

export function calendarDayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function parseCalendarDayKey(value: string | null): Date | null {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!(year && month && day)) {
    return null;
  }
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Local date + `HH:MM` → the instant the user means. */
export function combineDateAndTime(date: Date, time: string) {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

export function toTimeInputValue(date: Date) {
  return format(date, "HH:mm");
}

export function getCalendarEntryState(
  entry: ContentCalendarEntry
): CalendarEntryState {
  if (entry.kind === "published") {
    return "published";
  }
  const statuses = entry.schedule.publications.map(
    (publication) => publication.status
  );
  if (statuses.includes("publishing")) {
    return "publishing";
  }
  const failed = statuses.includes("failed");
  if (failed && statuses.includes("published")) {
    return "partial";
  }
  if (failed) {
    return "failed";
  }
  if (statuses.includes("scheduled")) {
    return "scheduled";
  }
  return "published";
}

/** Whether a schedule can still be edited or moved as a whole. */
export function isScheduleEditable(schedule: PostSchedule | null) {
  return Boolean(
    schedule?.publications.length &&
    schedule.publications.every(
      (publication) => publication.status === "scheduled"
    )
  );
}

export function hasActiveSchedule(schedule: PostSchedule | null) {
  return Boolean(
    schedule?.publications.some(
      (publication) =>
        publication.status === "scheduled" ||
        publication.status === "publishing"
    )
  );
}

/** The external destinations of a schedule, as the schedule input takes them. */
export function scheduleDestinationsOf(
  schedule: PostSchedule
): ScheduleDestinationInput[] {
  const destinations: ScheduleDestinationInput[] = [];
  for (const publication of schedule.publications) {
    if (publication.destination === "github" && publication.repositoryId) {
      destinations.push({
        destination: "github",
        repositoryId: publication.repositoryId,
        merge: publication.merge ?? true,
      });
    }
    if (publication.destination === "social" && publication.accountId) {
      destinations.push({
        destination: "social",
        accountId: publication.accountId,
      });
    }
  }
  return destinations;
}

/**
 * Upcoming runs of the organization's generation schedules inside the range.
 * These are projections from the cron settings; nothing is stored for them.
 */
export function projectAutomationRuns(
  triggers: Trigger[],
  range: ContentCalendarRange,
  now = new Date()
): CalendarItem[] {
  const items: CalendarItem[] = [];
  const start = new Date(Math.max(range.from.getTime(), now.getTime()));
  for (const trigger of triggers) {
    const cron = trigger.sourceConfig.cron;
    if (!(trigger.enabled && cron)) {
      continue;
    }
    let cursor = start;
    for (let index = 0; index < CONTENT_CALENDAR_MAX_PROJECTED_RUNS; index++) {
      const next = computeNextRun(cron, cursor);
      if (next.getTime() >= range.to.getTime()) {
        break;
      }
      items.push({
        kind: "automation",
        key: `automation:${trigger.id}:${next.toISOString()}`,
        at: next,
        trigger,
      });
      cursor = next;
    }
  }
  return items;
}

export function calendarEntryItems(
  entries: ContentCalendarEntry[]
): CalendarItem[] {
  return entries.flatMap((entry): CalendarItem[] => {
    const at =
      entry.kind === "scheduled"
        ? entry.schedule.scheduledAt
        : entry.post.publishedAt;
    if (!at) {
      return [];
    }
    return [
      {
        kind: "entry",
        key:
          entry.kind === "scheduled"
            ? `scheduled:${entry.post.id}:${entry.schedule.scheduledAt}`
            : `published:${entry.post.id}`,
        at: new Date(at),
        entry,
        state: getCalendarEntryState(entry),
      },
    ];
  });
}

export function groupCalendarItemsByDay(items: CalendarItem[]) {
  const byDay = new Map<string, CalendarItem[]>();
  const sorted = [...items].sort((a, b) => a.at.getTime() - b.at.getTime());
  for (const item of sorted) {
    const key = calendarDayKey(item.at);
    const list = byDay.get(key);
    if (list) {
      list.push(item);
    } else {
      byDay.set(key, [item]);
    }
  }
  return byDay;
}
