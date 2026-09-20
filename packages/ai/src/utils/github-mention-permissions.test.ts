import { describe, expect, test } from "bun:test";

import {
  buildGitHubMentionPermissionReply,
  findMissingGitHubMentionPermissions,
  isGitHubPermissionError,
} from "@notra/ai/utils/github-mention-permissions";

describe("isGitHubPermissionError", () => {
  test("recognizes a refused App call", () => {
    expect(
      isGitHubPermissionError(
        new Error("Resource not accessible by integration")
      )
    ).toBe(true);
  });

  test("leaves rate limits and other failures alone", () => {
    expect(
      isGitHubPermissionError(
        new Error("You have exceeded a secondary rate limit")
      )
    ).toBe(false);
    expect(isGitHubPermissionError(new Error("Not Found"))).toBe(false);
    expect(isGitHubPermissionError("Resource not accessible")).toBe(false);
  });
});

describe("findMissingGitHubMentionPermissions", () => {
  test("a commit needs contents and pull requests", () => {
    expect(
      findMissingGitHubMentionPermissions({
        access: { contents: "read", issues: "write", pullRequests: "write" },
        mode: "same_pull_request",
        commentKind: "issue",
      })
    ).toEqual(["Contents: Read and write"]);
    expect(
      findMissingGitHubMentionPermissions({
        access: { contents: "write", issues: "write", pullRequests: "write" },
        mode: "new_pull_request",
        commentKind: "issue",
      })
    ).toEqual([]);
  });

  test("a PR conversation answer needs Issues or Pull requests write", () => {
    expect(
      findMissingGitHubMentionPermissions({
        access: { contents: "read", issues: "write", pullRequests: "read" },
        mode: "reply_only",
        commentKind: "issue",
      })
    ).toEqual([]);
    expect(
      findMissingGitHubMentionPermissions({
        access: { contents: "read", pullRequests: "write" },
        mode: "reply_only",
        commentKind: "issue",
      })
    ).toEqual([]);
    expect(
      findMissingGitHubMentionPermissions({
        access: { contents: "read", issues: "read", pullRequests: "read" },
        mode: "reply_only",
        commentKind: "issue",
      })
    ).toEqual(["Pull requests: Read and write"]);
  });

  test("a review thread answer needs Pull requests write", () => {
    expect(
      findMissingGitHubMentionPermissions({
        access: { contents: "read", issues: "write", pullRequests: "read" },
        mode: "reply_only",
        commentKind: "review",
      })
    ).toEqual(["Pull requests: Read and write"]);
  });

  test("unknown access does not block the run", () => {
    expect(
      findMissingGitHubMentionPermissions({
        access: null,
        mode: "same_pull_request",
        commentKind: "issue",
      })
    ).toEqual([]);
  });
});

describe("buildGitHubMentionPermissionReply", () => {
  test("names the permission and links the installation", () => {
    const reply = buildGitHubMentionPermissionReply({
      missing: ["Contents: Read and write"],
      settingsUrl: "https://github.com/settings/installations/1",
    });
    expect(reply).toContain("**Contents: Read and write**");
    expect(reply).toContain(
      "[installation settings](https://github.com/settings/installations/1)"
    );
  });

  test("stays useful without details", () => {
    const reply = buildGitHubMentionPermissionReply({
      missing: [],
      settingsUrl: null,
    });
    expect(reply).toContain("GitHub refused the request");
    expect(reply).toContain("configured GitHub credential");
    expect(reply).not.toContain("GitHub App");
    expect(reply).toContain("Mention me again");
  });
});
