import type {
  ContentCalendarEntry,
  PostSchedule,
} from "@notra/schemas/dashboard/content-calendar";
import type { ReactNode } from "react";

import type { Trigger } from "@/types/triggers/triggers";

export interface ContentCalendarRange {
  from: Date;
  to: Date;
}

export type CalendarEntryState =
  | "published"
  | "scheduled"
  | "publishing"
  | "failed"
  | "partial";

export type CalendarItem =
  | {
      kind: "entry";
      key: string;
      at: Date;
      entry: ContentCalendarEntry;
      state: CalendarEntryState;
    }
  | {
      kind: "automation";
      key: string;
      at: Date;
      trigger: Trigger;
    };

export interface CalendarDragPayload {
  postId: string;
  contentType: string;
  title: string;
  schedule: PostSchedule;
}

export interface ContentCalendarViewProps {
  organizationId: string;
  organizationSlug: string;
  /** Rendered at the end of the calendar's header row (the view switcher). */
  toolbarEnd?: ReactNode;
}

export interface ContentCalendarGridProps {
  days: Date[];
  month: Date;
  itemsByDay: Map<string, CalendarItem[]>;
  organizationSlug: string;
  onDropPost: (payload: CalendarDragPayload, day: Date) => void;
}

export interface ContentCalendarDayProps {
  day: Date;
  items: CalendarItem[];
  outside: boolean;
  organizationSlug: string;
  onDropPost: (payload: CalendarDragPayload, day: Date) => void;
}

export interface ContentCalendarItemChipProps {
  item: CalendarItem;
  organizationSlug: string;
  /** `cell` sits in a month cell; `list` is the roomier day popover row. */
  variant: "cell" | "list";
}
