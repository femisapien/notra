import { createScopedGitHubAppInstallationToken } from "@notra/ai/integrations/github";
import { createOctokit } from "@notra/ai/utils/octokit";

import {
  GITHUB_API_VERSION_HEADER,
  MAX_TARBALL_BYTES,
} from "./constants/github";
import { SitePermanentBuildError } from "./errors";
import type {
  BranchHead,
  CompleteCheckRunParams,
  CreateCheckRunParams,
  SiteRepository,
  SiteRepositoryColumns,
  SiteRepositoryPermissions,
} from "./types/github";

export class SiteRepositoryNotConnectedError extends SitePermanentBuildError {}

export function requireSiteRepository(
  site: SiteRepositoryColumns
): SiteRepository {
  if (
    !(site.githubInstallationId && site.repositoryOwner && site.repositoryName)
  ) {
    throw new SiteRepositoryNotConnectedError(
      "This site has no GitHub repository connected"
    );
  }
  return {
    installationId: site.githubInstallationId,
    owner: site.repositoryOwner,
    repo: site.repositoryName,
  };
}

/** Least-privilege token: one repository, only what the operation needs. */
export async function siteRepositoryToken(
  repository: SiteRepository,
  permissions: SiteRepositoryPermissions
): Promise<string> {
  return await createScopedGitHubAppInstallationToken(
    repository.installationId,
    {
      repositories: [repository.repo],
      permissions: { metadata: "read", ...permissions },
    }
  );
}

export async function downloadRepositoryTarball(
  repository: SiteRepository,
  token: string,
  commitSha: string
): Promise<Uint8Array<ArrayBuffer>> {
  const response = await fetch(
    `https://api.github.com/repos/${repository.owner}/${repository.repo}/tarball/${commitSha}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        ...GITHUB_API_VERSION_HEADER,
      },
      redirect: "follow",
    }
  );
  if (!response.ok) {
    throw new Error(
      `Downloading ${repository.owner}/${repository.repo}@${commitSha.slice(0, 7)} failed (${response.status})`
    );
  }
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > MAX_TARBALL_BYTES) {
    throw new SitePermanentBuildError("The repository is too large to build");
  }
  const reader = response.body?.getReader();
  if (!reader) {
    return new Uint8Array(new ArrayBuffer(0));
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    total += value.byteLength;
    if (total > MAX_TARBALL_BYTES) {
      await reader.cancel();
      throw new SitePermanentBuildError("The repository is too large to build");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(new ArrayBuffer(total));
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function getBranchHead(
  repository: SiteRepository,
  token: string,
  branch: string
): Promise<BranchHead> {
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
  return {
    sha: data.commit.sha,
    protected: data.protected,
    message: data.commit.commit.message.split("\n")[0] ?? null,
    author:
      data.commit.commit.author?.name ?? data.commit.author?.login ?? null,
  };
}

export async function createCheckRun(
  repository: SiteRepository,
  token: string,
  params: CreateCheckRunParams
): Promise<string> {
  const octokit = createOctokit(token);
  const { data } = await octokit.request(
    "POST /repos/{owner}/{repo}/check-runs",
    {
      owner: repository.owner,
      repo: repository.repo,
      name: params.name,
      head_sha: params.headSha,
      details_url: params.detailsUrl,
      external_id: params.externalId,
      status: "in_progress",
      started_at: new Date().toISOString(),
      output: { title: params.title, summary: params.summary },
      headers: GITHUB_API_VERSION_HEADER,
    }
  );
  return String(data.id);
}

export async function completeCheckRun(
  repository: SiteRepository,
  token: string,
  params: CompleteCheckRunParams
): Promise<void> {
  const octokit = createOctokit(token);
  await octokit.request(
    "PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}",
    {
      owner: repository.owner,
      repo: repository.repo,
      check_run_id: Number(params.checkRunId),
      status: "completed",
      conclusion: params.conclusion,
      completed_at: new Date().toISOString(),
      ...(params.detailsUrl ? { details_url: params.detailsUrl } : {}),
      output: {
        title: params.title,
        summary: params.summary,
        ...(params.text ? { text: params.text } : {}),
        ...(params.annotations?.length
          ? { annotations: params.annotations.slice(0, 50) }
          : {}),
      },
      headers: GITHUB_API_VERSION_HEADER,
    }
  );
}
