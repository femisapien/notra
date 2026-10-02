import type { SchedulePostFailureReason } from "@notra/ai/types/scheduled-publications";
import { listContentCalendar } from "@notra/ai/utils/content-calendar";
import {
  cancelPostSchedule,
  getPostSchedule,
  publishPostScheduleNow,
  retryScheduledPublication,
  schedulePostPublication,
} from "@notra/ai/utils/scheduled-publications";
import { db } from "@notra/db/drizzle";
import { posts } from "@notra/db/schema";
import { isProjectInOrganization } from "@notra/db/utils/projects";
import { POSTHOG_EVENTS } from "@notra/posthog/events";
import { contentInputSchema } from "@notra/schemas/dashboard/content";
import {
  contentCalendarRangeInputSchema,
  schedulePostInputSchema,
  scheduledPublicationIdInputSchema,
} from "@notra/schemas/dashboard/content-calendar";
import { and, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { after } from "next/server";

import { trackServerEvent } from "@/lib/analytics/posthog-server";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { assertActiveSubscription } from "@/lib/billing/subscription";
import { runScheduledPublicationSweep } from "@/lib/content/scheduled-publication-sweep";
import { publishSavedContentToGitHub } from "@/lib/integrations/github/publish-saved-content";

import { baseProcedure } from "../base";
import { badRequest, conflict, notFound } from "../utils/errors";

/** A slot this close publishes right away instead of waiting for the cron. */
const IMMEDIATE_PUBLISH_WINDOW_MS = 60 * 1000;

async function toScheduleError(reason: SchedulePostFailureReason) {
  const t = await getTranslations("errors.contentCalendar");
  switch (reason) {
    case "post_not_found":
      return notFound(t("postNotFound"));
    case "invalid_time":
      return badRequest(t("invalidTime"));
    case "destination_not_supported":
      return badRequest(t("destinationNotSupported"));
    case "repository_not_found":
      return badRequest(t("repositoryNotFound"));
    case "account_not_found":
      return badRequest(t("accountNotFound"));
    case "publishing_in_progress":
      return conflict(t("publishingInProgress"));
    default:
      return conflict(t("conflict"));
  }
}

/** Runs the sweep for one post right after the response, best effort. */
function publishDueNow(postId: string) {
  after(async () => {
    try {
      await runScheduledPublicationSweep({ postId });
    } catch (error) {
      // The cron picks the rows up within a minute.
      console.error("[ScheduledPublication] Immediate sweep failed", {
        postId,
        error,
      });
    }
  });
}

/**
 * Opens the GitHub pull request when a post is scheduled, so reviews and CI
 * run before the slot. The scheduled run then only updates and merges it.
 * Best effort: without it the run opens the pull request itself.
 */
function openPullRequestAhead(params: {
  organizationId: string;
  postId: string;
  repositoryId: string;
}) {
  after(async () => {
    try {
      const post = await db.query.posts.findFirst({
        columns: { contentType: true, githubPublish: true, markdown: true },
        where: and(
          eq(posts.id, params.postId),
          eq(posts.organizationId, params.organizationId)
        ),
      });
      if (
        !post?.markdown ||
        post.githubPublish ||
        !(post.contentType === "changelog" || post.contentType === "blog_post")
      ) {
        return;
      }
      await publishSavedContentToGitHub({
        organizationId: params.organizationId,
        contentId: params.postId,
        contentType: post.contentType,
        repositoryId: params.repositoryId,
      });
    } catch (error) {
      console.warn("[ScheduledPublication] Opening the PR ahead failed", {
        postId: params.postId,
        error,
      });
    }
  });
}

export const contentCalendarRouter = {
  list: baseProcedure
    .input(contentCalendarRangeInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });
      if (
        input.projectId &&
        !(await isProjectInOrganization(input.organizationId, input.projectId))
      ) {
        throw notFound("Project not found");
      }
      return listContentCalendar({
        organizationId: input.organizationId,
        projectId: input.projectId,
        from: new Date(input.from),
        to: new Date(input.to),
      });
    }),
  get: baseProcedure
    .input(contentInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });
      return {
        schedule: await getPostSchedule({
          organizationId: input.organizationId,
          postId: input.contentId,
        }),
      };
    }),
  schedule: baseProcedure
    .input(schedulePostInputSchema)
    .handler(async ({ context, input }) => {
      const auth = await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });
      await assertActiveSubscription(input.organizationId, "content.schedule");

      const scheduledAt = new Date(input.scheduledAt);
      const outcome = await schedulePostPublication({
        organizationId: input.organizationId,
        postId: input.contentId,
        scheduledAt,
        timeZone: input.timeZone,
        destinations: input.destinations,
        expectedScheduledIds: input.expectedScheduledIds,
        userId: auth.user.id,
      });
      if (!outcome.ok) {
        throw await toScheduleError(outcome.reason);
      }

      if (scheduledAt.getTime() - Date.now() <= IMMEDIATE_PUBLISH_WINDOW_MS) {
        publishDueNow(input.contentId);
      } else {
        const github = input.destinations.find(
          (destination) => destination.destination === "github"
        );
        if (github?.destination === "github") {
          openPullRequestAhead({
            organizationId: input.organizationId,
            postId: input.contentId,
            repositoryId: github.repositoryId,
          });
        }
      }

      trackServerEvent({
        event: POSTHOG_EVENTS.CONTENT_SCHEDULED,
        headers: context.headers,
        userId: auth.user.id,
        organizationId: input.organizationId,
        properties: {
          content_id: input.contentId,
          destinations: input.destinations.map((item) => item.destination),
          lead_hours: Math.round(
            (scheduledAt.getTime() - Date.now()) / (60 * 60 * 1000)
          ),
        },
      });

      return { schedule: outcome.schedule };
    }),
  cancel: baseProcedure
    .input(contentInputSchema)
    .handler(async ({ context, input }) => {
      const auth = await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });
      const result = await cancelPostSchedule({
        organizationId: input.organizationId,
        postId: input.contentId,
      });
      if (result.canceled > 0) {
        trackServerEvent({
          event: POSTHOG_EVENTS.CONTENT_SCHEDULE_CANCELED,
          headers: context.headers,
          userId: auth.user.id,
          organizationId: input.organizationId,
          properties: { content_id: input.contentId },
        });
      }
      return {
        ...result,
        schedule: await getPostSchedule({
          organizationId: input.organizationId,
          postId: input.contentId,
        }),
      };
    }),
  publishNow: baseProcedure
    .input(contentInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });
      await assertActiveSubscription(
        input.organizationId,
        "content.schedule.publishNow"
      );
      const moved = await publishPostScheduleNow({
        organizationId: input.organizationId,
        postId: input.contentId,
      });
      if (moved === 0) {
        const t = await getTranslations("errors.contentCalendar");
        throw notFound(t("nothingScheduled"));
      }
      publishDueNow(input.contentId);
      return {
        schedule: await getPostSchedule({
          organizationId: input.organizationId,
          postId: input.contentId,
        }),
      };
    }),
  retry: baseProcedure
    .input(scheduledPublicationIdInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });
      await assertActiveSubscription(
        input.organizationId,
        "content.schedule.retry"
      );
      const result = await retryScheduledPublication({
        organizationId: input.organizationId,
        scheduledPublicationId: input.scheduledPublicationId,
      });
      if (!result.ok) {
        const t = await getTranslations("errors.contentCalendar");
        throw result.reason === "conflict"
          ? conflict(t("conflict"))
          : notFound(t("nothingScheduled"));
      }
      publishDueNow(result.postId);
      return {
        schedule: await getPostSchedule({
          organizationId: input.organizationId,
          postId: result.postId,
        }),
      };
    }),
};
