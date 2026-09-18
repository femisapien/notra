import type { GitHubMentionOctokit } from "@notra/ai/types/github-mention";
import { updateContentPublicationHead } from "@notra/ai/utils/content-publication";
import { commitFilesToPullRequest } from "@notra/ai/utils/github-pr-commit";
import { updatePostRecord } from "@notra/ai/utils/post-service";

async function retryAfterCommit<T>(run: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function updatePublishedContentAndCommit(params: {
  octokit: GitHubMentionOctokit;
  organizationId: string;
  postId: string;
  markdown: string;
  title?: string;
  owner: string;
  repo: string;
  branch: string;
  expectedHeadOid: string;
  path: string;
  publicationId: string;
  commitMessage: string;
  /** False when committing to a follow-up branch that is not the publication's pull request. */
  recordPublicationHead?: boolean;
}) {
  // Commit first: a rejected commit (stale head, protected branch) must not
  // leave the Notra post ahead of the pull request.
  const commitSha = await commitFilesToPullRequest({
    octokit: params.octokit,
    owner: params.owner,
    repo: params.repo,
    branch: params.branch,
    expectedHeadOid: params.expectedHeadOid,
    headline: params.commitMessage,
    files: [{ path: params.path, contents: params.markdown }],
  });
  await retryAfterCommit(() =>
    updatePostRecord({
      organizationId: params.organizationId,
      postId: params.postId,
      markdown: params.markdown,
      title: params.title,
    })
  );
  if (params.recordPublicationHead ?? true) {
    await retryAfterCommit(() =>
      updateContentPublicationHead({
        publicationId: params.publicationId,
        organizationId: params.organizationId,
        headSha: commitSha,
        branch: params.branch,
      })
    );
  }
  return { commitSha, postId: params.postId, path: params.path };
}

/**
 * Keeps the Notra post in step when the published file was committed through
 * another path (plain file commit or the sandbox). The file is the post's
 * markdown one to one, so its new contents become the post. Returns whether
 * the post changed; the publication head is recorded either way.
 */
export async function syncPublishedPostAfterCommit(params: {
  organizationId: string;
  publication: { id: string; postId: string; path: string } | null;
  files: ReadonlyArray<{ path: string; contents: string }>;
  commitSha: string;
  branch: string;
  recordPublicationHead: boolean;
}) {
  const publication = params.publication;
  if (!publication) {
    return false;
  }
  if (params.recordPublicationHead) {
    await retryAfterCommit(() =>
      updateContentPublicationHead({
        publicationId: publication.id,
        organizationId: params.organizationId,
        headSha: params.commitSha,
        branch: params.branch,
      })
    );
  }
  const file = params.files.find((entry) => entry.path === publication.path);
  if (!file) {
    return false;
  }
  await retryAfterCommit(() =>
    updatePostRecord({
      organizationId: params.organizationId,
      postId: publication.postId,
      markdown: file.contents,
    })
  );
  return true;
}
