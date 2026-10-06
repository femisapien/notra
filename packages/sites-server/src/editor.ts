import { GITHUB_CREATE_COMMIT_ON_BRANCH_MUTATION } from "@notra/ai/constants/github";
import { createOctokit } from "@notra/ai/utils/octokit";
import { db } from "@notra/db/drizzle";
import { siteDrafts } from "@notra/db/schema";
import { validateSite } from "@notra/sites-compiler/validate";
import { SITE_CONFIG_FILENAME } from "@notra/sites-core/constants/sites";
import { isSiteSourcePath } from "@notra/sites-core/utils/source-files";
import { and, eq } from "drizzle-orm";

import {
  DEFAULT_PUBLISH_HEADLINE,
  EDITABLE_PATH_SEGMENT,
  EDITABLE_TEXT_FILE,
  MAX_DRAFT_BYTES,
  MAX_PUBLISH_HEADLINE_LENGTH,
  PULL_REQUEST_RULE_TYPES,
  SITE_EDIT_BRANCH_PREFIX,
  VALIDATED_SOURCE_FILE,
} from "./constants/editor";
import { GITHUB_API_VERSION_HEADER } from "./constants/github";
import { SiteInputError, SitePublishConflictError } from "./errors";
import { getBranchHead, siteRepositoryAccess } from "./github";
import type {
  CreateCommitOnBranchResponse,
  PublishSiteDraftsInput,
  PublishSiteDraftsResult,
  RepositoryCommitInput,
  RepositoryPullRequestInput,
  RepositoryFileRef,
  RepositoryBranchInput,
  SaveSiteDraftInput,
  SiteDraft,
  SiteSourceEntry,
  SiteSourceFileContent,
  SiteSourceListing,
} from "./types/editor";
import type { SiteRepository } from "./types/github";
import type { Site } from "./types/sites";
import { timestampedBranchName } from "./utils/branch-name";
import { errorMessage, isNotFoundError } from "./utils/errors";
import { prefixedId } from "./utils/ids";
import { repositoryPath } from "./utils/root-directory";

/**
 * Only text files the site actually uses are editable, never anything outside
 * the site root and never a hidden file or folder.
 */
function assertEditablePath(path: string): void {
  const editable =
    isSiteSourcePath(path) &&
    EDITABLE_TEXT_FILE.test(path) &&
    path
      .split("/")
      .every(
        (segment) =>
          !segment.startsWith(".") && EDITABLE_PATH_SEGMENT.test(segment)
      );
  if (!editable) {
    throw new SiteInputError(`${path} is not an editable site file`);
  }
}

function readAccess(site: Site) {
  return siteRepositoryAccess(site, { contents: "read" });
}

/** The site's files on the production branch head, from one recursive tree call. */
export async function listSiteSourceFiles(
  site: Site
): Promise<SiteSourceListing> {
  const { repository, token } = await readAccess(site);
  const head = await getBranchHead(repository, token, site.productionBranch);
  const { data: tree } = await createOctokit(token).request(
    "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
    {
      owner: repository.owner,
      repo: repository.repo,
      tree_sha: head.sha,
      recursive: "1",
      headers: GITHUB_API_VERSION_HEADER,
    }
  );
  const prefix = site.rootDirectory ? `${site.rootDirectory}/` : "";
  const files: SiteSourceEntry[] = [];
  for (const entry of tree.tree) {
    if (
      entry.type !== "blob" ||
      !entry.path ||
      !entry.sha ||
      !entry.path.startsWith(prefix)
    ) {
      continue;
    }
    const path = entry.path.slice(prefix.length);
    if (!isSiteSourcePath(path)) {
      continue;
    }
    files.push({ path, sha: entry.sha, size: entry.size ?? 0 });
  }
  return {
    commitSha: head.sha,
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
  };
}

export async function readSiteSourceFile(
  site: Site,
  path: string
): Promise<SiteSourceFileContent | null> {
  assertEditablePath(path);
  const { repository, token } = await readAccess(site);
  return await readRepositoryFile(repository, token, {
    path: repositoryPath(site.rootDirectory, path),
    ref: site.productionBranch,
  });
}

/** One file of a repository at `ref`, by its path from the repository root; null when missing. */
export async function readRepositoryFile(
  repository: SiteRepository,
  token: string,
  file: RepositoryFileRef
): Promise<SiteSourceFileContent | null> {
  const octokit = createOctokit(token);
  try {
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner: repository.owner,
        repo: repository.repo,
        path: file.path,
        ref: file.ref,
        headers: GITHUB_API_VERSION_HEADER,
      }
    );
    if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
      return null;
    }
    return {
      content: Buffer.from(data.content, "base64").toString("utf8"),
      sha: data.sha,
    };
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}

/** A new branch at `sha`, for changes that go through a pull request. */
export async function createRepositoryBranch(
  repository: SiteRepository,
  token: string,
  branch: RepositoryBranchInput
): Promise<void> {
  await createOctokit(token).request("POST /repos/{owner}/{repo}/git/refs", {
    owner: repository.owner,
    repo: repository.repo,
    ref: `refs/heads/${branch.name}`,
    sha: branch.sha,
    headers: GITHUB_API_VERSION_HEADER,
  });
}

/**
 * One signed commit on `branch` through the GraphQL API, so no git objects
 * are built by hand. Fails when the branch moved past `expectedHeadOid`.
 */
export async function commitRepositoryFiles(
  repository: SiteRepository,
  token: string,
  commit: RepositoryCommitInput
): Promise<string> {
  const result = await createOctokit(
    token
  ).graphql<CreateCommitOnBranchResponse>(
    GITHUB_CREATE_COMMIT_ON_BRANCH_MUTATION,
    {
      input: {
        branch: {
          repositoryNameWithOwner: `${repository.owner}/${repository.repo}`,
          branchName: commit.branch,
        },
        message: { headline: commit.headline },
        expectedHeadOid: commit.expectedHeadOid,
        fileChanges: {
          additions: commit.additions.map((file) => ({
            path: file.path,
            contents: Buffer.from(file.content).toString("base64"),
          })),
          deletions: commit.deletions.map((path) => ({ path })),
        },
      },
    }
  );
  return result.createCommitOnBranch.commit.oid;
}

export async function openRepositoryPullRequest(
  repository: SiteRepository,
  token: string,
  pullRequest: RepositoryPullRequestInput
): Promise<string> {
  const { data } = await createOctokit(token).request(
    "POST /repos/{owner}/{repo}/pulls",
    {
      owner: repository.owner,
      repo: repository.repo,
      title: pullRequest.title,
      head: pullRequest.head,
      base: pullRequest.base,
      body: pullRequest.body,
      headers: GITHUB_API_VERSION_HEADER,
    }
  );
  return data.html_url;
}

export async function listSiteDrafts(siteId: string): Promise<SiteDraft[]> {
  return await db
    .select()
    .from(siteDrafts)
    .where(eq(siteDrafts.siteId, siteId));
}

/** Drafts are stored in Notra only; the live site and the repository do not change until publish. */
export async function saveSiteDraft(
  site: Site,
  input: SaveSiteDraftInput
): Promise<SiteDraft> {
  assertEditablePath(input.path);
  if (Buffer.byteLength(input.content, "utf8") > MAX_DRAFT_BYTES) {
    throw new SiteInputError("This file is too large to edit in the browser");
  }
  const [draft] = await db
    .insert(siteDrafts)
    .values({
      id: prefixedId("drf"),
      siteId: site.id,
      path: input.path,
      content: input.content,
      baseBlobSha: input.baseBlobSha,
      baseCommitSha: input.baseCommitSha,
      deleted: input.deleted ?? false,
      updatedByUserId: input.userId,
    })
    .onConflictDoUpdate({
      target: [siteDrafts.siteId, siteDrafts.path],
      // The client sends the version it edits on top of; a rebase after a conflict moves it forward.
      set: {
        content: input.content,
        deleted: input.deleted ?? false,
        baseBlobSha: input.baseBlobSha,
        baseCommitSha: input.baseCommitSha,
        updatedByUserId: input.userId,
        updatedAt: new Date(),
      },
    })
    .returning();
  if (!draft) {
    throw new Error("Could not save draft");
  }
  return draft;
}

/**
 * Resolves a publish conflict without losing the edit: the draft keeps its
 * content but is now based on the file as it is on GitHub right now. The user
 * reviews it against the published version before publishing again.
 */
export async function rebaseSiteDraft(
  site: Site,
  path: string
): Promise<SiteDraft | null> {
  const [draft] = await db
    .select()
    .from(siteDrafts)
    .where(and(eq(siteDrafts.siteId, site.id), eq(siteDrafts.path, path)))
    .limit(1);
  if (!draft) {
    return null;
  }
  const current = await readSiteSourceFile(site, path);
  const [updated] = await db
    .update(siteDrafts)
    .set({ baseBlobSha: current?.sha ?? null, updatedAt: new Date() })
    .where(eq(siteDrafts.id, draft.id))
    .returning();
  return updated ?? null;
}

export async function discardSiteDraft(
  siteId: string,
  path: string
): Promise<void> {
  await db
    .delete(siteDrafts)
    .where(and(eq(siteDrafts.siteId, siteId), eq(siteDrafts.path, path)));
}

async function validateWithDrafts(site: Site, drafts: SiteDraft[]) {
  const { files: tree } = await listSiteSourceFiles(site);
  const files = new Map<string, string | null>();
  for (const entry of tree) {
    files.set(entry.path, null);
  }
  const draftPaths = new Set(drafts.map((draft) => draft.path));
  const needsContent = tree.filter(
    (entry) =>
      (VALIDATED_SOURCE_FILE.test(entry.path) ||
        entry.path === SITE_CONFIG_FILENAME) &&
      !draftPaths.has(entry.path)
  );
  const contents = await Promise.all(
    needsContent.map((entry) => readSiteSourceFile(site, entry.path))
  );
  for (const [index, entry] of needsContent.entries()) {
    files.set(entry.path, contents[index]?.content ?? null);
  }
  for (const draft of drafts) {
    if (draft.deleted) {
      files.delete(draft.path);
    } else {
      files.set(draft.path, draft.content);
    }
  }
  return validateSite({ files });
}

/**
 * Validates the site as it would look with all drafts applied. Unchanged MDX
 * is only checked for existence (imports); snippets and notra.json are read so
 * named imports and the config can be checked too. Nothing is executed.
 */
export async function validateSiteDrafts(site: Site) {
  return await validateWithDrafts(site, await listSiteDrafts(site.id));
}

/** Whether the branch only accepts changes through a pull request (classic protection or a ruleset). */
async function requiresPullRequest(
  repository: SiteRepository,
  token: string,
  branch: string
): Promise<boolean> {
  if ((await getBranchHead(repository, token, branch)).protected) {
    return true;
  }
  // Repository rulesets do not show up as classic protection.
  const { data: rules } = await createOctokit(token).request(
    "GET /repos/{owner}/{repo}/rules/branches/{branch}",
    {
      owner: repository.owner,
      repo: repository.repo,
      branch,
      headers: GITHUB_API_VERSION_HEADER,
    }
  );
  return rules.some((rule) => PULL_REQUEST_RULE_TYPES.has(rule.type));
}

/** Direct publishing needs the site to allow it and the branch to be unprotected; it never bypasses protection. */
async function assertDirectPublishAllowed(
  site: Site,
  repository: SiteRepository,
  token: string
): Promise<void> {
  if (await requiresPullRequest(repository, token, site.productionBranch)) {
    throw new SiteInputError(
      `${site.productionBranch} is protected on GitHub. Publish as a pull request instead.`
    );
  }
  if (site.publishMode !== "direct") {
    throw new SiteInputError(
      "Direct publishing is turned off for this site. Publish as a pull request instead."
    );
  }
}

/**
 * Publishes all drafts as one commit, the way the repository allows it:
 * directly to the production branch when nothing protects it and the site
 * allows it, otherwise as a branch + pull request. Never bypasses protection.
 * A file that changed on GitHub since its draft was started is a conflict.
 */
export async function publishSiteDrafts(
  site: Site,
  input: PublishSiteDraftsInput
): Promise<PublishSiteDraftsResult> {
  const drafts = await listSiteDrafts(site.id);
  if (drafts.length === 0) {
    throw new SiteInputError("There are no changes to publish");
  }
  const validation = await validateWithDrafts(site, drafts);
  if (!validation.ok) {
    const first = validation.diagnostics.find(
      (diagnostic) => diagnostic.severity === "error"
    );
    throw new SiteInputError(
      `Fix the errors first: ${first?.file ?? "site"}: ${first?.message ?? "invalid site"}`
    );
  }

  const { repository, token } = await siteRepositoryAccess(site, {
    contents: "write",
    pull_requests: "write",
  });
  const { commitSha: headSha, files } = await listSiteSourceFiles(site);
  const current = new Map(files.map((file) => [file.path, file.sha]));
  const conflicts = drafts
    .filter((draft) => (current.get(draft.path) ?? null) !== draft.baseBlobSha)
    .map((draft) => draft.path);
  if (conflicts.length > 0) {
    throw new SitePublishConflictError(
      conflicts,
      `Changed on GitHub since you started editing: ${conflicts.join(", ")}. Reload them and re-apply your edits.`
    );
  }

  const { mode } = input;
  if (mode === "direct") {
    await assertDirectPublishAllowed(site, repository, token);
  }
  const branch =
    mode === "direct"
      ? site.productionBranch
      : timestampedBranchName(SITE_EDIT_BRANCH_PREFIX, new Date());
  if (mode === "pull_request") {
    await createRepositoryBranch(repository, token, {
      name: branch,
      sha: headSha,
    });
  }

  const headline =
    input.message.trim().slice(0, MAX_PUBLISH_HEADLINE_LENGTH) ||
    DEFAULT_PUBLISH_HEADLINE;
  let commitSha: string;
  try {
    commitSha = await commitRepositoryFiles(repository, token, {
      branch,
      headline,
      expectedHeadOid: headSha,
      additions: drafts
        .filter((draft) => !draft.deleted)
        .map((draft) => ({
          path: repositoryPath(site.rootDirectory, draft.path),
          content: draft.content,
        })),
      deletions: drafts
        .filter((draft) => draft.deleted)
        .map((draft) => repositoryPath(site.rootDirectory, draft.path)),
    });
  } catch (error) {
    if (/expected|head|oid/i.test(errorMessage(error))) {
      throw new SitePublishConflictError(
        [],
        `${branch} moved while publishing. Try again.`
      );
    }
    throw error;
  }

  const pullRequestUrl =
    mode === "pull_request"
      ? await openRepositoryPullRequest(repository, token, {
          title: headline,
          head: branch,
          base: site.productionBranch,
          body: `Edited in Notra.\n\n${drafts.map((draft) => `- ${draft.deleted ? "Delete" : "Update"} \`${draft.path}\``).join("\n")}`,
        })
      : null;
  // Only drafts whose content is exactly what was committed. The upsert keeps the row id,
  // so an autosave that landed while publishing changed the content and must stay.
  await Promise.all(
    drafts.map((draft) =>
      db
        .delete(siteDrafts)
        .where(
          and(
            eq(siteDrafts.id, draft.id),
            eq(siteDrafts.content, draft.content),
            eq(siteDrafts.deleted, draft.deleted)
          )
        )
    )
  );
  return { mode, commitSha, pullRequestUrl };
}
