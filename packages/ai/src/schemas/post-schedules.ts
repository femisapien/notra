import { z } from "zod";

import { isValidTimezone } from "../utils/current-date";

export const schedulePostToolInputSchema = z.object({
  postId: z.string().trim().min(1).describe("ID of the post to publish."),
  scheduledAt: z.iso
    .datetime({ offset: true })
    .describe(
      "When to publish, as an ISO 8601 timestamp with offset, in the future and at most a year ahead. Convert from the user's timezone."
    ),
  timeZone: z
    .string()
    .trim()
    .refine(isValidTimezone, "Unknown time zone")
    .describe("IANA time zone of the user, for example Europe/Berlin."),
  githubRepositoryId: z
    .string()
    .trim()
    .min(1)
    .optional()
    .describe(
      "GitHub integration ID to publish a blog post or changelog to. Omit to only publish in Notra."
    ),
  mergePullRequest: z
    .boolean()
    .optional()
    .describe(
      "Merge the pull request at the scheduled time. Defaults to true when githubRepositoryId is set."
    ),
  socialAccountId: z
    .string()
    .trim()
    .min(1)
    .optional()
    .describe(
      "Connected X or LinkedIn account ID to post a tweet or LinkedIn post from."
    ),
});

export const postScheduleToolInputSchema = z.object({
  postId: z.string().trim().min(1).describe("ID of the post."),
});

export type SchedulePostToolInput = z.infer<typeof schedulePostToolInputSchema>;
export type PostScheduleToolInput = z.infer<typeof postScheduleToolInputSchema>;
