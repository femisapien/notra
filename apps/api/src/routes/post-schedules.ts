import { createRoute } from "@hono/zod-openapi";
import type { SchedulePostFailureReason } from "@notra/ai/types/scheduled-publications";
import {
  cancelPostSchedule,
  getPostSchedule,
  schedulePostPublication,
} from "@notra/ai/utils/scheduled-publications";
import { getPostParamsSchema } from "@notra/schemas/api/content";
import {
  cancelPostScheduleResponseSchema,
  postScheduleResponseSchema,
  schedulePostRequestSchema,
} from "@notra/schemas/api/post-schedules";

import { getOrganizationId } from "../utils/auth";
import { createOpenApiApp } from "../utils/openapi-app";
import { errorResponse, rateLimitResponse } from "../utils/openapi-responses";
import { getOrganizationResponse } from "../utils/organizations";
import { enforceRatelimit, RATE_LIMITS, ratelimit } from "../utils/ratelimit";

export const postSchedulesRoutes = createOpenApiApp();

const SCHEDULE_FAILURES: Record<
  SchedulePostFailureReason,
  { status: 400 | 404 | 409; error: string }
> = {
  post_not_found: { status: 404, error: "Post not found" },
  invalid_time: {
    status: 400,
    error: "scheduledAt must be between now and one year ahead",
  },
  destination_not_supported: {
    status: 400,
    error: "This content type cannot be published to that destination",
  },
  repository_not_found: {
    status: 400,
    error: "GitHub repository not found or not enabled",
  },
  account_not_found: {
    status: 400,
    error: "Social account not found for this content type's platform",
  },
  publishing_in_progress: {
    status: 409,
    error: "The post is being published right now; retry in a minute",
  },
  conflict: {
    status: 409,
    error: "The schedule changed concurrently; retry the request",
  },
};

const getPostScheduleRoute = createRoute({
  method: "get",
  path: "/posts/{postId}/schedule",
  tags: ["Content"],
  operationId: "getPostSchedule",
  summary: "Get a post's publishing schedule",
  description:
    "Returns the post's current schedule with the state of every destination, or null when nothing is scheduled.",
  request: { params: getPostParamsSchema },
  responses: {
    200: {
      description: "Schedule fetched successfully",
      content: { "application/json": { schema: postScheduleResponseSchema } },
    },
    400: errorResponse("Invalid path params"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    404: errorResponse("Organization not found"),
    503: errorResponse("Authentication service unavailable"),
  },
});

const schedulePostRoute = createRoute({
  method: "post",
  path: "/posts/{postId}/schedule",
  tags: ["Content"],
  operationId: "schedulePost",
  summary: "Schedule a post for publishing",
  description:
    "Publishes the post automatically at scheduledAt: it is marked as published in Notra and, optionally, opened and merged as a GitHub pull request or posted to a connected X or LinkedIn account. Replaces any schedule that has not started. The post is published as saved at that time, so later edits are included. Publishing runs within about a minute of scheduledAt; transient errors are retried automatically.",
  request: {
    params: getPostParamsSchema,
    body: {
      content: { "application/json": { schema: schedulePostRequestSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Post scheduled successfully",
      content: { "application/json": { schema: postScheduleResponseSchema } },
    },
    400: errorResponse("Invalid request body or destination"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    404: errorResponse("Post not found"),
    409: errorResponse("Post is publishing or the schedule changed"),
    429: rateLimitResponse(
      RATE_LIMITS.postUpdate.requests,
      RATE_LIMITS.postUpdate.window,
      "API key"
    ),
    503: errorResponse("Authentication service unavailable"),
  },
});

const cancelPostScheduleRoute = createRoute({
  method: "delete",
  path: "/posts/{postId}/schedule",
  tags: ["Content"],
  operationId: "cancelPostSchedule",
  summary: "Cancel a post's publishing schedule",
  description:
    "Cancels every destination that has not started and clears failed ones. A destination that is already publishing finishes; inProgress reports it.",
  request: { params: getPostParamsSchema },
  responses: {
    200: {
      description: "Schedule canceled",
      content: {
        "application/json": { schema: cancelPostScheduleResponseSchema },
      },
    },
    400: errorResponse("Invalid path params"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    404: errorResponse("Organization not found"),
    429: rateLimitResponse(
      RATE_LIMITS.postUpdate.requests,
      RATE_LIMITS.postUpdate.window,
      "API key"
    ),
    503: errorResponse("Authentication service unavailable"),
  },
});

const FORBIDDEN_UNSCOPED = {
  error: "Forbidden: API key must be scoped to an organization",
};

postSchedulesRoutes.openapi(getPostScheduleRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(FORBIDDEN_UNSCOPED, 403);
  }
  const organization = await getOrganizationResponse(c.get("db"), orgId);
  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }
  const { postId } = c.req.valid("param");
  const schedule = await getPostSchedule({ organizationId: orgId, postId });
  return c.json({ organization, schedule }, 200);
});

postSchedulesRoutes.openapi(schedulePostRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(FORBIDDEN_UNSCOPED, 403);
  }
  const organization = await getOrganizationResponse(c.get("db"), orgId);
  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }
  const rateLimited = await enforceRatelimit(c, ratelimit.postUpdate);
  if (rateLimited) {
    return rateLimited;
  }
  const { postId } = c.req.valid("param");
  const body = c.req.valid("json");
  const outcome = await schedulePostPublication({
    organizationId: orgId,
    postId,
    scheduledAt: new Date(body.scheduledAt),
    timeZone: body.timeZone,
    destinations: body.destinations,
    userId: null,
  });
  if (!outcome.ok) {
    const failure = SCHEDULE_FAILURES[outcome.reason];
    return c.json({ error: failure.error }, failure.status);
  }
  return c.json({ organization, schedule: outcome.schedule }, 200);
});

postSchedulesRoutes.openapi(cancelPostScheduleRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(FORBIDDEN_UNSCOPED, 403);
  }
  const organization = await getOrganizationResponse(c.get("db"), orgId);
  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }
  const rateLimited = await enforceRatelimit(c, ratelimit.postUpdate);
  if (rateLimited) {
    return rateLimited;
  }
  const { postId } = c.req.valid("param");
  const result = await cancelPostSchedule({ organizationId: orgId, postId });
  return c.json({ organization, ...result }, 200);
});
