import { GITHUB_MENTION_FILE_CONTENT_MAX_BYTES } from "@notra/ai/constants/github-mention";
import type {
  GitHubMentionContext,
  GitHubMentionFileChange,
  GitHubMentionOctokit,
} from "@notra/ai/types/github-mention";
import { findOpenContentPublicationForPost } from "@notra/ai/utils/content-publication";
import { runGitHubMentionSandbox } from "@notra/ai/utils/github-mention-sandbox";
import {
  type GitHubMentionWriteState,
  ensureFollowUpPullRequest,
  resolveGitHubMentionWriteTarget,
} from "@notra/ai/utils/github-mention-write-target";
import {
  commitFilesToPullRequest,
  getRepositoryFileContents,
} from "@notra/ai/utils/github-pr-commit";
import { updatePostRecord } from "@notra/ai/utils/post-service";
import {
  syncPublishedPostAfterCommit,
  updatePublishedContentAndCommit,
} from "@notra/ai/utils/update-published-content";
import { db } from "@notra/db/drizzle";
import { posts } from "@notra/db/schema";
import { type Tool, tool } from "ai";
import { and, eq } from "drizzle-orm";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export interface GitHubMentionToolState extends GitHubMentionWriteState {
  committed: boolean;
  commitSha: string | null;
  pullRequestUrl: string | null;
}

async function recordWrite(
  params: {
    octokit: GitHubMentionOctokit;
    context: GitHubMentionContext;
    state: GitHubMentionToolState;
  },
  commitSha: string,
  target: { branch: string; pullRequestUrl: string }
) {
  const followUp = await ensureFollowUpPullRequest({
    octokit: params.octokit,
    context: params.context,
    state: params.state,
    branch: target.branch,
  });
  params.state.committed = true;
  params.state.commitSha = commitSha;
  params.state.pullRequestUrl = followUp?.htmlUrl ?? target.pullRequestUrl;
}

/**
 * The model may call several write tools in one step. Each commit moves the
 * branch head, so overlapping writes fail GitHub's expectedHeadOid check.
 * Running them one after another lets each resolve the head the previous left.
 */
function createWriteQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(task: () => Promise<T>): Promise<T> => {
    const run = tail.then(task, task);
    tail = run.catch(() => undefined);
    return run;
  };
}

export function buildGitHubMentionTools(params: {
  octokit: GitHubMentionOctokit;
  context: GitHubMentionContext;
  state: GitHubMentionToolState;
}): Record<string, Tool> {
  const { octokit, context, state } = params;
  const replyOnly = context.destination.mode === "reply_only";

  const readTools: Record<string, Tool> = {
    viewPublishedPost: tool({
      description:
        "Reads the Notra post linked to this pull request, or a post by id in this organization.",
      inputSchema: z.object({
        postId: z
          .string()
          .optional()
          .describe("Optional post id. Defaults to the linked publication."),
      }),
      execute: async ({ postId }) => {
        const resolvedPostId = postId ?? context.publication?.postId;
        if (!resolvedPostId) {
          return {
            error: "No published Notra post is linked to this pull request.",
          };
        }
        const post = await db.query.posts.findFirst({
          where: and(
            eq(posts.id, resolvedPostId),
            eq(posts.organizationId, context.organizationId)
          ),
          columns: {
            id: true,
            title: true,
            slug: true,
            markdown: true,
            contentType: true,
            status: true,
          },
        });
        if (!post) {
          return { error: "Post not found" };
        }
        return post;
      },
    }),
  };

  if (replyOnly) {
    return readTools;
  }

  const inWriteOrder = createWriteQueue();

  return {
    ...readTools,
    getPullRequestFile: tool({
      description: "Reads a file from the mention pull request head branch.",
      inputSchema: z.object({
        path: z.string().describe("Repository-relative file path"),
      }),
      execute: async ({ path }) => {
        const target = await resolveGitHubMentionWriteTarget({
          octokit,
          context,
          state,
        });
        const contents = await getRepositoryFileContents({
          octokit,
          owner: context.owner,
          repo: context.repo,
          path,
          ref: target.branch,
        });
        if (
          Buffer.byteLength(contents, "utf8") >
          GITHUB_MENTION_FILE_CONTENT_MAX_BYTES
        ) {
          return { error: "File is too large to load into the mention agent." };
        }
        return { path, contents };
      },
    }),
    updatePublishedContent: tool({
      description:
        "Updates the Notra post linked to this pull request and commits the file onto the mention pull request. Do not use this for questions.",
      inputSchema: z.object({
        markdown: z
          .string()
          .describe("Updated markdown for the published file"),
        title: z.string().optional().describe("Optional updated title"),
        commitMessage: z
          .string()
          .optional()
          .describe(
            "Commit headline. Defaults to a short docs update message."
          ),
      }),
      execute: ({ markdown, title, commitMessage }) =>
        inWriteOrder(async () => {
          const publication = context.publication;
          if (!publication) {
            return {
              error:
                "No Notra publication is linked to this pull request. Use commitFilesToPullRequest to edit files on the PR instead.",
            };
          }
          const target = await resolveGitHubMentionWriteTarget({
            octokit,
            context,
            state,
          });
          const result = await updatePublishedContentAndCommit({
            octokit,
            organizationId: context.organizationId,
            postId: publication.postId,
            markdown,
            title,
            owner: context.owner,
            repo: context.repo,
            branch: target.branch,
            expectedHeadOid: target.expectedHeadOid,
            path: publication.path,
            publicationId: publication.id,
            recordPublicationHead:
              context.destination.mode === "same_pull_request",
            commitMessage:
              commitMessage ??
              `docs: update ${publication.title ?? publication.path}`,
          });
          await recordWrite(
            { octokit, context, state },
            result.commitSha,
            target
          );
          return {
            postId: publication.postId,
            path: publication.path,
            commitSha: result.commitSha,
            pullRequestUrl: state.pullRequestUrl,
          };
        }),
    }),
    commitFilesToPullRequest: tool({
      description:
        "Commits one or more files onto the mention pull request head. Use after reading files when the change is not the linked Notra publication.",
      inputSchema: z.object({
        headline: z.string().describe("Commit headline"),
        files: z
          .array(
            z.object({
              path: z.string(),
              contents: z.string(),
            })
          )
          .min(1),
      }),
      execute: ({ headline, files }) =>
        inWriteOrder(async () => {
          const target = await resolveGitHubMentionWriteTarget({
            octokit,
            context,
            state,
          });
          const commitSha = await commitFilesToPullRequest({
            octokit,
            owner: context.owner,
            repo: context.repo,
            branch: target.branch,
            expectedHeadOid: target.expectedHeadOid,
            headline,
            files: files as GitHubMentionFileChange[],
          });
          const postUpdated = await syncPublishedPostAfterCommit({
            organizationId: context.organizationId,
            publication: context.publication,
            files,
            commitSha,
            branch: target.branch,
            recordPublicationHead:
              context.destination.mode === "same_pull_request",
          });
          await recordWrite({ octokit, context, state }, commitSha, target);
          return {
            commitSha,
            pullRequestUrl: state.pullRequestUrl,
            postUpdated,
          };
        }),
    }),
    runRepoSandbox: tool({
      description:
        "Runs a repository sandbox on the mention pull request branch when you need a working tree. Do not use this for questions or single-file content edits.",
      inputSchema: z.object({
        instruction: z
          .string()
          .describe("What the sandbox should change in the working tree"),
      }),
      execute: ({ instruction }) =>
        inWriteOrder(async () => {
          const target = await resolveGitHubMentionWriteTarget({
            octokit,
            context,
            state,
          });
          const result = await runGitHubMentionSandbox({
            octokit,
            context,
            instruction,
            branch: target.branch,
          });
          if (!result.available) {
            return { error: result.error };
          }
          if (result.commitSha) {
            await recordWrite(
              { octokit, context, state },
              result.commitSha,
              target
            );
          }
          return result;
        }),
    }),
    updatePostById: tool({
      description:
        "Updates a Notra post by id without committing. Use when you need to change the draft in Notra only.",
      inputSchema: z.object({
        postId: z.string(),
        markdown: z.string().optional(),
        title: z.string().optional(),
      }),
      execute: async ({ postId, markdown, title }) => {
        const publication = await findOpenContentPublicationForPost({
          organizationId: context.organizationId,
          postId,
        });
        await updatePostRecord({
          organizationId: context.organizationId,
          postId,
          markdown,
          title,
        });
        return {
          postId,
          linkedPullRequest: publication?.pullRequestUrl ?? null,
        };
      },
    }),
  };
}
