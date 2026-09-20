import { describe, expect, test } from "bun:test";

import type {
  GitHubMentionContext,
  GitHubMentionOctokit,
} from "@notra/ai/types/github-mention";

import {
  type GitHubMentionWriteState,
  resolveGitHubMentionWriteTarget,
} from "./github-mention-write-target";

function fakeOctokit(head: { ref: string; repoFullName: string | null }) {
  return {
    request: async () => ({
      data: {
        number: 7,
        title: "docs",
        body: null,
        html_url: "https://github.com/acme/app/pull/7",
        head: {
          ref: head.ref,
          sha: "abc123",
          repo: head.repoFullName ? { full_name: head.repoFullName } : null,
        },
        base: { ref: "release" },
        draft: false,
      },
    }),
  } as unknown as GitHubMentionOctokit;
}

function context(
  mode: GitHubMentionContext["destination"]["mode"]
): GitHubMentionContext {
  return {
    owner: "acme",
    repo: "app",
    defaultBranch: "main",
    issueNumber: 7,
    comment: { id: 1, body: "@notra-ai fix", htmlUrl: "", review: null },
    destination: {
      mode,
      pullRequestNumber: 7,
      headRef: "main",
      headSha: "abc123",
    },
  } as GitHubMentionContext;
}

const emptyState = (): GitHubMentionWriteState => ({
  writeBranch: null,
  writePullNumber: null,
  writePullRequestUrl: null,
});

describe("resolveGitHubMentionWriteTarget", () => {
  test("refuses to commit when the pull request head is the default branch", async () => {
    await expect(
      resolveGitHubMentionWriteTarget({
        octokit: fakeOctokit({ ref: "main", repoFullName: "acme/app" }),
        context: context("same_pull_request"),
        state: emptyState(),
      })
    ).rejects.toThrow("default branch");
  });

  test("refuses to commit to fork pull requests", async () => {
    await expect(
      resolveGitHubMentionWriteTarget({
        octokit: fakeOctokit({ ref: "fix-docs", repoFullName: "someone/app" }),
        context: context("same_pull_request"),
        state: emptyState(),
      })
    ).rejects.toThrow("Fork");
  });

  test("rejects fork follow-ups before creating a branch", async () => {
    const octokit = {
      request: async (route: string) => {
        if (route === "GET /repos/{owner}/{repo}/pulls/{pull_number}") {
          return {
            data: {
              number: 7,
              title: "docs",
              body: null,
              html_url: "https://github.com/acme/app/pull/7",
              head: {
                ref: "fix-docs",
                sha: "abc123",
                repo: { full_name: "someone/app" },
              },
              base: { ref: "release" },
              draft: false,
            },
          };
        }
        if (route === "POST /repos/{owner}/{repo}/git/refs") {
          throw new Error("Must not create a fork follow-up branch");
        }
        if (route === "GET /repos/{owner}/{repo}/git/ref/{ref}") {
          return { data: { object: { sha: "abc123" } } };
        }
        throw new Error(route);
      },
    } as unknown as GitHubMentionOctokit;
    const state = emptyState();
    await expect(
      resolveGitHubMentionWriteTarget({
        octokit,
        context: context("new_pull_request"),
        state,
      })
    ).rejects.toThrow("Fork");
    expect(state.writeBranch).toBeNull();
  });

  test("keeps the revision read by the agent even when the remote head moves", async () => {
    const initial = context("same_pull_request");
    initial.destination.headSha = "read-before-manual-push";
    const target = await resolveGitHubMentionWriteTarget({
      octokit: fakeOctokit({ ref: "docs", repoFullName: "acme/app" }),
      context: initial,
      state: emptyState(),
    });
    expect(target.expectedHeadOid).toBe("read-before-manual-push");
    const subsequent = await resolveGitHubMentionWriteTarget({
      octokit: fakeOctokit({ ref: "docs", repoFullName: "acme/app" }),
      context: initial,
      state: { ...emptyState(), commitSha: "this-runs-commit" },
    });
    expect(subsequent.expectedHeadOid).toBe("this-runs-commit");
  });

  test("targets the head branch of a same-repository pull request", async () => {
    const target = await resolveGitHubMentionWriteTarget({
      octokit: fakeOctokit({
        ref: "notra/changelog",
        repoFullName: "Acme/App",
      }),
      context: context("same_pull_request"),
      state: emptyState(),
    });
    expect(target).toMatchObject({
      branch: "notra/changelog",
      expectedHeadOid: "abc123",
      pullNumber: 7,
    });
  });

  test("includes the comment kind in a follow-up branch", async () => {
    const reviewContext = context("new_pull_request");
    reviewContext.comment.review = {
      path: "README.md",
      line: 1,
      startLine: null,
      commitSha: "abc123",
      diffHunk: null,
      rootCommentId: 1,
    };
    let createdRef = "";
    const octokit = {
      request: async (route: string, request: Record<string, unknown>) => {
        if (route === "GET /repos/{owner}/{repo}/pulls/{pull_number}") {
          return fakeOctokit({ ref: "docs", repoFullName: "acme/app" }).request(
            route as never,
            request as never
          );
        }
        if (route === "POST /repos/{owner}/{repo}/git/refs") {
          createdRef = request.ref as string;
          return { data: {} };
        }
        return { data: { object: { sha: "abc123" } } };
      },
    } as unknown as GitHubMentionOctokit;
    const target = await resolveGitHubMentionWriteTarget({
      octokit,
      context: reviewContext,
      state: emptyState(),
    });
    expect(createdRef).toBe("refs/heads/notra/mention-7-review-1");
    expect(target.branch).toBe("notra/mention-7-review-1");
  });
});
