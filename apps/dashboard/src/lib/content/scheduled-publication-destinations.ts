import { SCHEDULED_PUBLICATION_ERROR_CODES } from "@notra/ai/constants/scheduled-publications";
import { getGitHubPublishToken } from "@notra/ai/integrations/github-publish-auth";
import type {
  ScheduledPublicationAttempt,
  ScheduledPublicationOutcome,
} from "@notra/ai/types/scheduled-publications";
import { createOctokit } from "@notra/ai/utils/octokit";
import { markScheduledPublicationExternalAttempt } from "@notra/ai/utils/scheduled-publications";
import { db } from "@notra/db/drizzle";
import { githubIntegrations, posts } from "@notra/db/schema";
import { POSTHOG_EVENTS } from "@notra/posthog/events";
import { postGitHubPublishSchema } from "@notra/schemas/dashboard/content";
import { publishEventInTransaction } from "@notra/webhooks/drizzle";
import { postPublishedInput } from "@notra/webhooks/utils/posts";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

import { trackServerEventAndFlush } from "@/lib/analytics/posthog-server";
import { resolveAiProductAccess } from "@/lib/billing/subscription";
import { requestGeoRescanForPublishedPost } from "@/lib/geo/rescan";
import { publishSavedContentToGitHub } from "@/lib/integrations/github/publish-saved-content";
import { publishSocialPost } from "@/lib/social-connect/publish";
import type { ScheduledPublicationPost } from "@/types/content/scheduled-publications";
import { hasGitHubStatus } from "@/utils/github-publish-failure";

const GITHUB_MERGE_METHODS = ["squash", "merge", "rebase"] as const;
const MARK_READY_FOR_REVIEW_MUTATION = `
  mutation MarkReadyForReview($pullRequestId: ID!) {
    markPullRequestReadyForReview(input: { pullRequestId: $pullRequestId }) {
      pullRequest { id }
    }
  }
`;
const RETRYABLE_ORPC_CODES = new Set([
  "INTERNAL_SERVER_ERROR",
  "BAD_GATEWAY",
  "SERVICE_UNAVAILABLE",
  "GATEWAY_TIMEOUT",
  "TOO_MANY_REQUESTS",
  "TIMEOUT",
]);

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function failure(
  code: string,
  message: string,
  retryable: boolean,
  result?: Extract<ScheduledPublicationOutcome, { kind: "error" }>["result"]
): ScheduledPublicationOutcome {
  return { kind: "error", code, message, retryable, result };
}

/** Upstream and infrastructure failures are worth a retry; bad input is not. */
function isRetryablePublishError(error: unknown) {
  if (error instanceof ORPCError) {
    return RETRYABLE_ORPC_CODES.has(error.code);
  }
  return true;
}

async function publishInNotra(
  attempt: ScheduledPublicationAttempt,
  post: ScheduledPublicationPost
): Promise<ScheduledPublicationOutcome> {
  // Guarded like Iris shipping: a post someone published by hand in the
  // meantime counts as done instead of being stamped a second time. The
  // `post.published` webhook goes into the outbox in the same transaction,
  // like the public API's publish, and its source key dedupes replays.
  const published = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(posts)
      .set({ status: "published", publishedAt: new Date() })
      .where(
        and(
          eq(posts.id, attempt.postId),
          eq(posts.organizationId, attempt.organizationId),
          eq(posts.status, "draft")
        )
      )
      .returning({ id: posts.id });
    if (row) {
      await publishEventInTransaction(
        tx,
        postPublishedInput({
          organizationId: attempt.organizationId,
          postId: attempt.postId,
        })
      );
    }
    return row;
  });
  if (!published) {
    return { kind: "published", result: { alreadyPublished: true } };
  }
  await Promise.all([
    requestGeoRescanForPublishedPost({
      organizationId: attempt.organizationId,
      postId: attempt.postId,
    }),
    trackServerEventAndFlush({
      event: POSTHOG_EVENTS.CONTENT_PUBLISHED,
      userId: attempt.createdByUserId,
      organizationId: attempt.organizationId,
      properties: {
        content_id: attempt.postId,
        type: post.contentType,
        from: "schedule",
      },
    }).catch((error: unknown) => {
      console.error("[ScheduledPublication] PostHog capture failed", error);
    }),
  ]);
  return { kind: "published", result: {} };
}

async function mergePullRequest(params: {
  organizationId: string;
  repositoryId: string;
  pullRequestNumber: number;
  pullRequestUrl: string;
  headSha: string | null;
}): Promise<ScheduledPublicationOutcome> {
  const repository = await db.query.githubIntegrations.findFirst({
    columns: { owner: true, repo: true },
    where: and(
      eq(githubIntegrations.id, params.repositoryId),
      eq(githubIntegrations.organizationId, params.organizationId)
    ),
  });
  const partial = {
    pullRequestNumber: params.pullRequestNumber,
    pullRequestUrl: params.pullRequestUrl,
  };
  if (!(repository?.owner && repository.repo)) {
    return failure(
      SCHEDULED_PUBLICATION_ERROR_CODES.GITHUB_MERGE_FAILED,
      "The GitHub repository is no longer connected.",
      false,
      partial
    );
  }
  const token = await getGitHubPublishToken(params.repositoryId, {
    organizationId: params.organizationId,
  });
  const octokit = createOctokit(token ?? undefined);
  const target = {
    owner: repository.owner,
    repo: repository.repo,
    pull_number: params.pullRequestNumber,
  };

  let lastError: unknown = null;
  try {
    const { data: pullRequest } = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}",
      target
    );
    if (pullRequest.merged) {
      return { kind: "published", result: { ...partial, merged: true } };
    }
    // Notra opens content pull requests as drafts, which GitHub refuses to
    // merge. Scheduling the merge is the author's go-ahead to leave draft.
    if (pullRequest.draft) {
      await octokit.graphql(MARK_READY_FOR_REVIEW_MUTATION, {
        pullRequestId: pullRequest.node_id,
      });
    }
  } catch (error) {
    return failure(
      SCHEDULED_PUBLICATION_ERROR_CODES.GITHUB_MERGE_FAILED,
      `The pull request is open but could not be prepared for merging: ${errorMessage(error, "unknown error")}`,
      !(hasGitHubStatus(error, 403) || hasGitHubStatus(error, 404)),
      partial
    );
  }

  for (const mergeMethod of GITHUB_MERGE_METHODS) {
    try {
      await octokit.request(
        "PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge",
        {
          ...target,
          merge_method: mergeMethod,
          // Merge exactly the commit this attempt pushed, never a later push.
          ...(params.headSha ? { sha: params.headSha } : {}),
        }
      );
      return { kind: "published", result: { ...partial, merged: true } };
    } catch (error) {
      lastError = error;
      // 405 covers both "method not allowed in this repo" and "not
      // mergeable yet"; only the first is worth trying the next method for.
      const methodNotAllowed =
        hasGitHubStatus(error, 405) &&
        /merge method|not allowed/i.test(errorMessage(error, ""));
      if (!methodNotAllowed) {
        break;
      }
    }
  }

  // Someone merged it by hand between the push and our merge call.
  try {
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}",
      target
    );
    if (data.merged) {
      return { kind: "published", result: { ...partial, merged: true } };
    }
  } catch {
    // Report the merge error below.
  }

  const retryable =
    hasGitHubStatus(lastError, 405) ||
    hasGitHubStatus(lastError, 409) ||
    !(hasGitHubStatus(lastError, 403) || hasGitHubStatus(lastError, 404));
  return failure(
    SCHEDULED_PUBLICATION_ERROR_CODES.GITHUB_MERGE_FAILED,
    `The pull request is open but could not be merged: ${errorMessage(lastError, "unknown error")}`,
    retryable,
    partial
  );
}

/**
 * Whether the post's linked pull request was merged already. A retry after a
 * merge whose outcome was lost must not try to publish the file again (the
 * target exists on the default branch now), so a merged link counts as done.
 */
async function findMergedLinkedPullRequest(
  attempt: ScheduledPublicationAttempt,
  repositoryId: string,
  post: ScheduledPublicationPost
) {
  const linked = postGitHubPublishSchema.safeParse(post.githubPublish);
  if (!(linked.success && linked.data.repositoryId === repositoryId)) {
    return null;
  }
  try {
    const token = await getGitHubPublishToken(repositoryId, {
      organizationId: attempt.organizationId,
    });
    const { data } = await createOctokit(token ?? undefined).request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}",
      {
        owner: linked.data.owner,
        repo: linked.data.repo,
        pull_number: linked.data.pullRequestNumber,
      }
    );
    return data.merged ? linked.data : null;
  } catch {
    return null;
  }
}

async function publishToGitHub(
  attempt: ScheduledPublicationAttempt,
  post: ScheduledPublicationPost,
  config: { repositoryId: string; merge: boolean }
): Promise<ScheduledPublicationOutcome> {
  if (!(post.contentType === "changelog" || post.contentType === "blog_post")) {
    return failure(
      SCHEDULED_PUBLICATION_ERROR_CODES.GITHUB_PUBLISH_FAILED,
      "This content type cannot be published to GitHub.",
      false
    );
  }
  if (config.merge) {
    const merged = await findMergedLinkedPullRequest(
      attempt,
      config.repositoryId,
      post
    );
    if (merged) {
      return {
        kind: "published",
        result: {
          merged: true,
          pullRequestNumber: merged.pullRequestNumber,
          pullRequestUrl: merged.pullRequestUrl,
        },
      };
    }
  }

  // A retry after a failed merge goes straight back to merging. Pushing the
  // content again would add a commit and restart CI on every attempt, so a
  // repository with required checks could never be merged in time.
  const previous = attempt.result;
  if (
    config.merge &&
    previous?.pullRequestNumber &&
    previous.pullRequestUrl &&
    !previous.merged
  ) {
    return mergePullRequest({
      organizationId: attempt.organizationId,
      repositoryId: config.repositoryId,
      headSha: null,
      pullRequestNumber: previous.pullRequestNumber,
      pullRequestUrl: previous.pullRequestUrl,
    });
  }

  let published: Awaited<ReturnType<typeof publishSavedContentToGitHub>>;
  try {
    published = await publishSavedContentToGitHub({
      organizationId: attempt.organizationId,
      contentId: attempt.postId,
      contentType: post.contentType,
      repositoryId: config.repositoryId,
    });
  } catch (error) {
    return failure(
      SCHEDULED_PUBLICATION_ERROR_CODES.GITHUB_PUBLISH_FAILED,
      errorMessage(error, "Publishing to GitHub failed."),
      isRetryablePublishError(error)
    );
  }

  const result = {
    pullRequestNumber: published.pullRequestNumber,
    pullRequestUrl: published.pullRequestUrl,
  };
  if (!config.merge) {
    return { kind: "published", result };
  }
  return mergePullRequest({
    organizationId: attempt.organizationId,
    repositoryId: config.repositoryId,
    headSha: published.headSha ?? null,
    ...result,
  });
}

async function publishToSocial(
  attempt: ScheduledPublicationAttempt,
  claimToken: string,
  post: ScheduledPublicationPost,
  accountId: string
): Promise<ScheduledPublicationOutcome> {
  const content = (post.markdown ?? "").trim();
  if (!content) {
    return failure(
      SCHEDULED_PUBLICATION_ERROR_CODES.EMPTY_CONTENT,
      "The post has no text to publish.",
      false
    );
  }
  // Posting is not idempotent. From here on, a lost outcome is final.
  const marked = await markScheduledPublicationExternalAttempt({
    id: attempt.id,
    claimToken,
  });
  if (!marked) {
    return failure(
      SCHEDULED_PUBLICATION_ERROR_CODES.OUTCOME_UNKNOWN,
      "Another attempt already sent this post.",
      false
    );
  }
  const outcome = await Effect.runPromise(
    Effect.result(
      publishSocialPost({
        organizationId: attempt.organizationId,
        accountId,
        content,
      })
    )
  );
  if (outcome._tag === "Failure") {
    return failure(
      SCHEDULED_PUBLICATION_ERROR_CODES.SOCIAL_PUBLISH_FAILED,
      outcome.failure.message,
      false
    );
  }
  await trackServerEventAndFlush({
    event: POSTHOG_EVENTS.CONTENT_SOCIAL_PUBLISHED,
    userId: attempt.createdByUserId,
    organizationId: attempt.organizationId,
    properties: {
      platform: outcome.success.platform,
      from: "schedule",
      account_id: accountId,
    },
  }).catch((error: unknown) => {
    console.error("[ScheduledPublication] PostHog capture failed", error);
  });
  return {
    kind: "published",
    result: {
      platformPostId: outcome.success.platformPostId,
      postUrl: outcome.success.postUrl,
    },
  };
}

/** Publishes one claimed destination. Never throws for destination errors. */
export async function publishScheduledDestination(
  attempt: ScheduledPublicationAttempt,
  claimToken: string
): Promise<ScheduledPublicationOutcome> {
  const post = await db.query.posts.findFirst({
    columns: {
      contentType: true,
      markdown: true,
      githubPublish: true,
    },
    where: and(
      eq(posts.id, attempt.postId),
      eq(posts.organizationId, attempt.organizationId)
    ),
  });
  if (!post) {
    return failure(
      SCHEDULED_PUBLICATION_ERROR_CODES.POST_NOT_FOUND,
      "The post no longer exists.",
      false
    );
  }

  let hasAccess: boolean;
  try {
    ({ hasAccess } = await resolveAiProductAccess(attempt.organizationId));
  } catch (error) {
    return failure(
      SCHEDULED_PUBLICATION_ERROR_CODES.UNEXPECTED,
      errorMessage(error, "Could not check the subscription."),
      true
    );
  }
  if (!hasAccess) {
    return failure(
      SCHEDULED_PUBLICATION_ERROR_CODES.SUBSCRIPTION_REQUIRED,
      "An active subscription is required to publish scheduled content.",
      false
    );
  }

  const config = attempt.destinationConfig;
  switch (config.destination) {
    case "notra":
      return publishInNotra(attempt, post);
    case "github":
      return publishToGitHub(attempt, post, config);
    case "social":
      return publishToSocial(attempt, claimToken, post, config.accountId);
    default:
      return failure(
        SCHEDULED_PUBLICATION_ERROR_CODES.UNEXPECTED,
        "Unknown destination.",
        false
      );
  }
}
