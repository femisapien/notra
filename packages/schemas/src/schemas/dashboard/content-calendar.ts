import "zod/compile";
import { isValidTimezone } from "@notra/ai/utils/current-date";
import {
  SCHEDULED_PUBLICATION_DESTINATIONS,
  SCHEDULED_PUBLICATION_STATUSES,
} from "@notra/db/constants/scheduled-publications";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

import {
  CONTENT_CALENDAR_MAX_RANGE_DAYS,
  CONTENT_CALENDAR_TIME_ZONE_MAX_LENGTH,
} from "../../constants/dashboard/content-calendar";
import {
  contentInputSchema,
  contentOrganizationIdInputSchema,
  contentProjectIdInputSchema,
} from "./content";

const DAY_MS = 24 * 60 * 60 * 1000;

export const scheduleTimeZoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(CONTENT_CALENDAR_TIME_ZONE_MAX_LENGTH)
  .refine(isValidTimezone, "Unknown time zone");

export const scheduleDestinationInputSchema = z.discriminatedUnion(
  "destination",
  [
    z.object({
      destination: z.literal("github"),
      repositoryId: z.string().trim().min(1).max(64),
      merge: z.boolean().default(true),
    }),
    z.object({
      destination: z.literal("social"),
      accountId: z.string().trim().min(1).max(64),
    }),
  ]
);

export const schedulePostInputSchema = contentInputSchema.extend({
  scheduledAt: z.iso.datetime({ offset: true }),
  timeZone: scheduleTimeZoneSchema,
  /** External destinations. Publishing in Notra is always part of a schedule. */
  destinations: z
    .array(scheduleDestinationInputSchema)
    .max(2)
    .refine(
      (destinations) =>
        new Set(destinations.map((item) => item.destination)).size ===
        destinations.length,
      "Each destination can only be added once"
    )
    .default([]),
  /**
   * Pending rows this call replaces, as the client last saw them. The server
   * rejects the call when they changed, so a stale view cannot resend a
   * destination that already went out.
   */
  expectedScheduledIds: z.array(z.string().min(1)).max(10).optional(),
});

export const scheduledPublicationIdInputSchema =
  contentOrganizationIdInputSchema.extend({
    scheduledPublicationId: z.string().trim().min(1),
  });

export const contentCalendarRangeInputSchema = contentOrganizationIdInputSchema
  .extend(contentProjectIdInputSchema.shape)
  .extend({
    from: z.iso.datetime({ offset: true }),
    to: z.iso.datetime({ offset: true }),
  })
  .refine(
    (input) => {
      const span = Date.parse(input.to) - Date.parse(input.from);
      return span > 0 && span <= CONTENT_CALENDAR_MAX_RANGE_DAYS * DAY_MS;
    },
    { message: "Invalid calendar range", path: ["to"] }
  );

export const scheduledPublicationStatusSchema = z.enum(
  SCHEDULED_PUBLICATION_STATUSES
);
export const scheduledPublicationDestinationSchema = z.enum(
  SCHEDULED_PUBLICATION_DESTINATIONS
);

export const scheduledPublicationSchema = z.object({
  id: z.string(),
  destination: scheduledPublicationDestinationSchema,
  status: scheduledPublicationStatusSchema,
  scheduledAt: z.iso.datetime(),
  timeZone: z.string(),
  repositoryId: z.string().nullable(),
  merge: z.boolean().nullable(),
  accountId: z.string().nullable(),
  attempts: z.number().int(),
  errorCode: z.string().nullable(),
  lastError: z.string().nullable(),
  resultUrl: z.string().nullable(),
  publishedAt: z.iso.datetime().nullable(),
});

export const postScheduleSchema = z.object({
  postId: z.string(),
  scheduledAt: z.iso.datetime(),
  timeZone: z.string(),
  publications: z.array(scheduledPublicationSchema),
});

export const calendarPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  contentType: z.string(),
  status: z.enum(["draft", "published"]),
  publishedAt: z.iso.datetime().nullable(),
  updatedAt: z.iso.datetime(),
});

export const contentCalendarEntrySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("scheduled"),
    post: calendarPostSchema,
    schedule: postScheduleSchema,
  }),
  z.object({
    kind: z.literal("published"),
    post: calendarPostSchema,
  }),
]);

export const contentCalendarResponseSchema = z.object({
  entries: z.array(contentCalendarEntrySchema),
});

export const postScheduleResponseSchema = z.object({
  schedule: postScheduleSchema.nullable(),
});

export type SchedulePostInput = z.infer<typeof schedulePostInputSchema>;
export type ScheduleDestinationInput = z.infer<
  typeof scheduleDestinationInputSchema
>;
export type ScheduledPublication = z.infer<typeof scheduledPublicationSchema>;
export type PostSchedule = z.infer<typeof postScheduleSchema>;
export type CalendarPost = z.infer<typeof calendarPostSchema>;
export type ContentCalendarEntry = z.infer<typeof contentCalendarEntrySchema>;
export type ContentCalendarResponse = z.infer<
  typeof contentCalendarResponseSchema
>;
export type PostScheduleResponse = z.infer<typeof postScheduleResponseSchema>;
