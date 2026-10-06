import { GITHUB_CREATE_COMMIT_ON_BRANCH_MUTATION } from "@notra/ai/constants/github";
import { createOctokit } from "@notra/ai/utils/octokit";
import { db } from "@notra/db/drizzle";
import { siteDrafts } from "@notra/db/schema";
import { validateSite } from "@notra/sites-compiler/validate";
import {
  SITE_CONFIG_FILENAME,
  SITE_SOURCE_EXTENSIONS,
} from "@notra/sites-core/constants/sites";
import { isSiteSourcePath } from "@notra/sites-core/utils/source-files";
import { and, eq } from "drizzle-orm";

import { MAX_DRAFT_BYTES } from "./constants/editor";
import { GITHUB_API_VERSION_HEADER } from "./constants/github";
import { requireSiteRepository, siteRepositoryToken } from "./github";
import { SiteInputError } from "./sites";
import type {
  PublishSiteDraftsInput,
  PublishSiteDraftsResult,
  RepositoryCommitInput,
  RepositoryPullRequestInput,
  SaveSiteDraftInput,
  SiteDraft,
  SiteRepositoryReadAccess,
  SiteSourceEntry,
  SiteSourceFileContent,
  SiteSourceListing,
} from "./types/editor";
import type { SiteRepository } from "./types/github";
import type { Site } from "./types/sites";

const EDITABLE_TEXT = /\.(?:mdx?|jsx?|json|css)$/i;
const PATH_SEGMENT = /^[A-Za-z0-9._@()+ -]+$/;

export class SitePublishConflictError extends Error {
  readonly name = "SitePublishConflictError";
  readonly paths: string[];
  constructor(paths: string[], message: string) {
    super(message);
    this.paths = paths;
  }
}

function repoPath(site: Site, sitePath: string): string {
  return site.rootDirectory ? `${site.rootDirectory}/${sitePath}` : sitePath;
}

/** Only files the site actually uses are editable, and never anything outside the site root. */
export function assertEditablePath(path: string): void {
  const segments = path.split("/");
  const allowedRoot = isSiteSourcePath(path);
  const allowedExtension = (SITE_SOURCE_EXTENSIONS as readonly string[]).some(
    (extension) => path.toLowerCase().endsWith(extension)
  );
  if (
    !allowedRoot ||
    !allowedExtension ||
    !EDITABLE_TEXT.test(path) ||
    segments.some(
      (segment) =>
        segment === "" ||
        segment === "." ||
        segment === ".." ||
        segment.startsWith(".") ||
        !PATH_SEGMENT.test(segment)
    )
  ) {
    throw new SiteInputError(`${path} is not an editable site file`);
  }
}

async function readToken(site: Site): Promise<SiteRepositoryReadAccess> {
  const repository = requireSiteRepository(site);
  return {
    repository,
    token: await siteRepositoryToken(repository, { contents: "read" }),
  };
}

/** The site's files on the production branch head, from one recursive tree call. */
export async function listSiteSourceFiles(
  site: Site
): Promise<SiteSourceListing> {
  const { repository, token } = await readToken(site);
  const octokit = createOctokit(token);
  const { data: branch } = await octokit.request(
    "GET /repos/{owner}/{repo}/branches/{branch}",
    {
      owner: repository.owner,
      repo: repository.repo,
      branch: site.productionBranch,
      headers: GITHUB_API_VERSION_HEADER,
    }
  );
  const { data: tree } = await octokit.request(
    "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
    {
      owner: repository.owner,
      repo: repository.repo,
      tree_sha: branch.commit.sha,
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
    commitSha: branch.commit.sha,
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
  };
}

export async function readSiteSourceFile(
  site: Site,
  path: string
): Promise<SiteSourceFileContent | null> {
  assertEditablePath(path);
  const { repository, token } = await readToken(site);
  return await readRepositoryFile(repository, token, {
    path: repoPath(site, path),
    ref: site.productionBranch,
  });
}

/** One file of a repository at `ref`, by its path from the repository root; null when missing. */
export async function readRepositoryFile(
  repository: SiteRepository,
  token: string,
  file: { path: string; ref: string }
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
    if ((error as { status?: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/** A new branch at `sha`, for changes that go through a pull request. */
export async function createRepositoryBranch(
  repository: SiteRepository,
  token: string,
  branch: { name: string; sha: string }
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
  const result = await createOctokit(token).graphql<{
    createCommitOnBranch: { commit: { oid: string } };
  }>(GITHUB_CREATE_COMMIT_ON_BRANCH_MUTATION, {
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
  });
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
      id: `drf_${crypto.randomUUID().replaceAll("-", "")}`,
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

/**
 * Validates the site as it would look with all drafts applied. Unchanged MDX
 * is only checked for existence (imports); snippets and notra.json are read so
 * named imports and the config can be checked too. Nothing is executed.
 */
export async function validateSiteDrafts(site: Site) {
  const drafts = await listSiteDrafts(site.id);
  const { files: tree } = await listSiteSourceFiles(site);
  const files = new Map<string, string | null>();
  for (const entry of tree) {
    files.set(entry.path, null);
  }
  const draftPaths = new Set(drafts.map((draft) => draft.path));
  const needsContent = tree.filter(
    (entry) =>
      (/\.jsx?$/i.test(entry.path) || entry.path === SITE_CONFIG_FILENAME) &&
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

async function requiresPullRequest(
  repository: SiteRepository,
  token: string,
  branch: string
): Promise<boolean> {
  const octokit = createOctokit(token);
  const { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/branches/{branch}",
    {
      owner: repository.owner,
      repo: repository.repo,
      branch,
      headers: GITHUB_API_VERSION_HEADER,
    }
  );
  if (data.protected) {
    return true;
  }
  // Repository rulesets do not show up as classic protection.
  const { data: rules } = await octokit.request(
    "GET /repos/{owner}/{repo}/rules/branches/{branch}",
    {
      owner: repository.owner,
      repo: repository.repo,
      branch,
      headers: GITHUB_API_VERSION_HEADER,
    }
  );
  return rules.some((rule) =>
    [
      "pull_request",
      "required_status_checks",
      "non_fast_forward",
      "update",
    ].includes(rule.type)
  );
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
  const validation = await validateSiteDrafts(site);
  if (!validation.ok) {
    const first = validation.diagnostics.find(
      (diagnostic) => diagnostic.severity === "error"
    );
    throw new SiteInputError(
      `Fix the errors first: ${first?.file ?? "site"}: ${first?.message ?? "invalid site"}`
    );
  }

  const repository = requireSiteRepository(site);
  const token = await siteRepositoryToken(repository, {
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

  const protectedBranch = await requiresPullRequest(
    repository,
    token,
    site.productionBranch
  );
  const mode =
    input.mode === "direct" && !protectedBranch && site.publishMode === "direct"
      ? "direct"
      : "pull_request";
  if (input.mode === "direct" && mode !== "direct") {
    if (protectedBranch) {
      throw new SiteInputError(
        `${site.productionBranch} is protected on GitHub. Publish as a pull request instead.`
      );
    }
    throw new SiteInputError(
      "Direct publishing is turned off for this site. Publish as a pull request instead."
    );
  }

  let branch = site.productionBranch;
  if (mode === "pull_request") {
    branch = `notra/site-edit-${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}`;
    await createRepositoryBranch(repository, token, {
      name: branch,
      sha: headSha,
    });
  }

  let commitSha: string;
  try {
    commitSha = await commitRepositoryFiles(repository, token, {
      branch,
      headline: input.message.trim().slice(0, 200) || "Update site content",
      expectedHeadOid: headSha,
      additions: drafts
        .filter((draft) => !draft.deleted)
        .map((draft) => ({
          path: repoPath(site, draft.path),
          content: draft.content,
        })),
      deletions: drafts
        .filter((draft) => draft.deleted)
        .map((draft) => repoPath(site, draft.path)),
    });
  } catch (error) {
    const message = (error as Error).message;
    if (/expected|head|oid/i.test(message)) {
      throw new SitePublishConflictError(
        [],
        `${branch} moved while publishing. Try again.`
      );
    }
    throw error;
  }

  let pullRequestUrl: string | null = null;
  if (mode === "pull_request") {
    pullRequestUrl = await openRepositoryPullRequest(repository, token, {
      title: input.message.trim().slice(0, 200) || "Update site content",
      head: branch,
      base: site.productionBranch,
      body: `Edited in Notra.\n\n${drafts.map((draft) => `- ${draft.deleted ? "Delete" : "Update"} \`${draft.path}\``).join("\n")}`,
    });
  }
  // Only drafts whose content is exactly what was committed. The upsert keeps the row id,
  // so an autosave that landed while publishing changed the content and must stay.
  for (const draft of drafts) {
    await db
      .delete(siteDrafts)
      .where(
        and(
          eq(siteDrafts.id, draft.id),
          eq(siteDrafts.content, draft.content),
          eq(siteDrafts.deleted, draft.deleted)
        )
      );
  }
  return { mode, commitSha, pullRequestUrl };
}
