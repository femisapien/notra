import { createOctokit } from "@notra/ai/utils/octokit";
import { fetchPublicUrl } from "@notra/ai/utils/public-fetch";
import { db } from "@notra/db/drizzle";
import {
  brandGuidelineAssets,
  brandGuidelineColors,
  brandGuidelineFonts,
  brandGuidelines,
  brandSettings,
  organizations,
} from "@notra/db/schema";
import { SITE_CONFIG_FILENAME } from "@notra/sites-core/constants/sites";
import { asc, desc, eq } from "drizzle-orm";

import { GITHUB_API_VERSION_HEADER } from "./constants/github";
import {
  STARTER_BRANCH_PREFIX,
  STARTER_COMMIT_HEADLINE,
  STARTER_FETCH_MAX_BYTES,
  STARTER_FETCH_MAX_REDIRECTS,
  STARTER_FETCH_TIMEOUT_MS,
  STARTER_PULL_REQUEST_TITLE,
} from "./constants/starter";
import {
  commitRepositoryFiles,
  createRepositoryBranch,
  openRepositoryPullRequest,
  readRepositoryFile,
} from "./editor";
import { getBranchHead, siteRepositoryToken } from "./github";
import { findOrganizationRepository, SiteInputError } from "./sites";
import type { SiteRepository } from "./types/github";
import type {
  LandingPageFacts,
  SiteStarterResult,
  SiteStarterScope,
  SiteStarterStatus,
  StarterBrandInput,
} from "./types/starter";
import { isSafeRootDirectory } from "./utils/root-directory";
import { buildSiteStarterFiles } from "./utils/starter-files";
import { extractLandingPage, normalizeWebsiteUrl } from "./utils/starter-html";

const STARTER_USER_AGENT = "NotraSites-Starter/1.0 (+https://usenotra.com)";

/** The repository, branch and root a starter is for; only repositories the organization connected. */
async function resolveStarterTarget(
  scope: SiteStarterScope,
  permissions: Parameters<typeof siteRepositoryToken>[1]
) {
  const row = await findOrganizationRepository(
    scope.organizationId,
    scope.repositoryId
  );
  const { owner, repo } = row?.integration ?? {};
  if (!(row && owner && repo)) {
    throw new SiteInputError(
      "Connect the repository through the Notra GitHub App first",
      { field: "repository" }
    );
  }
  const rootDirectory = scope.rootDirectory.trim().replace(/^\/+|\/+$/g, "");
  if (!isSafeRootDirectory(rootDirectory)) {
    throw new SiteInputError(
      "The root directory may only contain letters, digits, dots, dashes and slashes",
      { field: "rootDirectory" }
    );
  }
  const repository: SiteRepository = {
    installationId: row.installationId,
    owner,
    repo,
  };
  const token = await siteRepositoryToken(repository, permissions);
  const branch =
    scope.branch.trim() ||
    row.integration.defaultBranch ||
    (await defaultBranch(repository, token));
  return { repository, token, branch, rootDirectory };
}

async function defaultBranch(
  repository: SiteRepository,
  token: string
): Promise<string> {
  const { data } = await createOctokit(token).request(
    "GET /repos/{owner}/{repo}",
    {
      owner: repository.owner,
      repo: repository.repo,
      headers: GITHUB_API_VERSION_HEADER,
    }
  );
  return data.default_branch;
}

function rootPath(rootDirectory: string, path: string): string {
  return rootDirectory ? `${rootDirectory}/${path}` : path;
}

/** An open pull request Notra already opened with starter files for `base`. */
async function findOpenStarterPullRequest(
  repository: SiteRepository,
  token: string,
  base: string
): Promise<string | null> {
  const { data } = await createOctokit(token).request(
    "GET /repos/{owner}/{repo}/pulls",
    {
      owner: repository.owner,
      repo: repository.repo,
      state: "open",
      base,
      per_page: 100,
      headers: GITHUB_API_VERSION_HEADER,
    }
  );
  const pullRequest = data.find((candidate) =>
    candidate.head.ref.startsWith(STARTER_BRANCH_PREFIX)
  );
  return pullRequest?.html_url ?? null;
}

/** Whether the picked branch + root already has a notra.json, and any open starter pull request. */
export async function siteStarterStatus(
  scope: SiteStarterScope
): Promise<SiteStarterStatus> {
  const { repository, token, branch, rootDirectory } =
    await resolveStarterTarget(scope, {
      contents: "read",
      pull_requests: "read",
    });
  const [config, pullRequestUrl] = await Promise.all([
    readRepositoryFile(repository, token, {
      path: rootPath(rootDirectory, SITE_CONFIG_FILENAME),
      ref: branch,
    }),
    findOpenStarterPullRequest(repository, token, branch).catch(() => null),
  ]);
  return { hasConfig: config !== null, pullRequestUrl };
}

async function readCapped(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return "";
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < STARTER_FETCH_MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
    total += value.byteLength;
  }
  // The head and the header sit at the top; a cut-off tail only loses the footer.
  await reader.cancel().catch(() => undefined);
  return new TextDecoder()
    .decode(Buffer.concat(chunks))
    .slice(0, STARTER_FETCH_MAX_BYTES);
}

/**
 * One fetch of the public landing page through the SSRF-safe fetcher (public
 * addresses only, pinned DNS, ≤3 redirects, 8 s). Any failure means no facts.
 */
export async function fetchLandingPageFacts(
  websiteUrl: string
): Promise<LandingPageFacts | null> {
  try {
    const response = await fetchPublicUrl(
      websiteUrl,
      {
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9",
          "User-Agent": STARTER_USER_AGENT,
        },
      },
      {
        maxRedirects: STARTER_FETCH_MAX_REDIRECTS,
        timeoutMs: STARTER_FETCH_TIMEOUT_MS,
      }
    );
    const finalUrl = response.url || websiteUrl;
    const contentType = response.headers.get("content-type") ?? "";
    if (
      !response.ok ||
      !finalUrl.startsWith("https://") ||
      !contentType.includes("html")
    ) {
      await response.body?.cancel().catch(() => undefined);
      return null;
    }
    return extractLandingPage(await readCapped(response), finalUrl);
  } catch {
    return null;
  }
}

/** The organization's default brand identity, flattened to what the starter uses. */
export async function loadStarterBrand(
  organizationId: string
): Promise<Omit<StarterBrandInput, "landing">> {
  const [organization] = await db
    .select({ name: organizations.name, logo: organizations.logo })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);
  const [brand] = await db
    .select()
    .from(brandSettings)
    .where(eq(brandSettings.organizationId, organizationId))
    .orderBy(desc(brandSettings.isDefault), asc(brandSettings.createdAt))
    .limit(1);
  const [guideline] = brand
    ? await db
        .select({ id: brandGuidelines.id })
        .from(brandGuidelines)
        .where(eq(brandGuidelines.brandSettingsId, brand.id))
        .limit(1)
    : [];
  const [colors, fonts, assets] = guideline
    ? await Promise.all([
        db
          .select()
          .from(brandGuidelineColors)
          .where(eq(brandGuidelineColors.guidelineId, guideline.id))
          .orderBy(asc(brandGuidelineColors.sortOrder)),
        db
          .select()
          .from(brandGuidelineFonts)
          .where(eq(brandGuidelineFonts.guidelineId, guideline.id))
          .orderBy(asc(brandGuidelineFonts.sortOrder)),
        db
          .select()
          .from(brandGuidelineAssets)
          .where(eq(brandGuidelineAssets.guidelineId, guideline.id))
          .orderBy(asc(brandGuidelineAssets.sortOrder)),
      ])
    : [[], [], []];

  const colorFor = (role: (typeof colors)[number]["role"]) =>
    colors.find((color) => color.role === role);
  const primary = colorFor("primary") ?? colorFor("accent");
  const background = colorFor("background");
  const fontFor = (role: (typeof fonts)[number]["role"]) =>
    fonts.find((font) => font.role === role)?.family ?? null;
  // A mark next to the name reads best in a header; a wordmark replaces the name.
  const logoAssets = assets.filter((asset) => asset.kind === "logo");
  const logoKind = logoAssets.length > 0 ? "logo" : "wordmark";
  const assetFor = (variant: "light" | "dark") =>
    assets.find((asset) => asset.kind === logoKind && asset.variant === variant)
      ?.url ?? null;
  const lightLogo = assetFor("light") ?? assetFor("dark");
  const fallbackLogo = organization?.logo ?? null;

  let logo: StarterBrandInput["logo"] = null;
  if (lightLogo) {
    logo = {
      light: lightLogo,
      dark: assetFor("dark"),
      wordmark: logoKind === "wordmark",
    };
  } else if (fallbackLogo) {
    logo = { light: fallbackLogo, dark: null, wordmark: false };
  }

  return {
    name: brand?.companyName?.trim() || organization?.name || "",
    description: brand?.companyDescription ?? null,
    websiteUrl: normalizeWebsiteUrl(brand?.websiteUrl ?? null),
    logo,
    colors: {
      primary: primary?.lightValue ?? null,
      primaryDark: primary?.darkValue ?? null,
      backgroundLight: background?.lightValue ?? null,
      backgroundDark: background?.darkValue ?? null,
    },
    fonts: { heading: fontFor("heading"), body: fontFor("body") },
  };
}

function starterBranchName(now: Date): string {
  return `${STARTER_BRANCH_PREFIX}${now.toISOString().replace(/[-:T]/g, "").slice(0, 14)}`;
}

function pullRequestBody(paths: string[], websiteUrl: string | null): string {
  const source = websiteUrl
    ? `your Brand Identity in Notra and ${websiteUrl}`
    : "your Brand Identity in Notra";
  return [
    `Starter files for Notra Sites, generated from ${source}.`,
    "",
    ...paths.map((path) => `- \`${path}\``),
    "",
    "Merge this, then deploy the site in Notra. Everything here is plain JSON, MDX and Markdown you can edit.",
  ].join("\n");
}

/**
 * Opens a pull request (never a direct commit) with notra.json, header.mdx,
 * footer.mdx and a first post under the root directory. Files that already
 * exist are left out; an open starter pull request is returned instead of a
 * second one.
 */
export async function createSiteStarter(
  scope: SiteStarterScope,
  now: Date = new Date()
): Promise<SiteStarterResult> {
  const { repository, token, branch, rootDirectory } =
    await resolveStarterTarget(scope, {
      contents: "write",
      pull_requests: "write",
    });
  const existingPullRequest = await findOpenStarterPullRequest(
    repository,
    token,
    branch
  );
  if (existingPullRequest) {
    return { pullRequestUrl: existingPullRequest, created: false };
  }

  const brand = await loadStarterBrand(scope.organizationId);
  const landing = brand.websiteUrl
    ? await fetchLandingPageFacts(brand.websiteUrl)
    : null;
  const { files } = buildSiteStarterFiles({ ...brand, landing }, now);

  const existing = await Promise.all(
    files.map((file) =>
      readRepositoryFile(repository, token, {
        path: rootPath(rootDirectory, file.path),
        ref: branch,
      })
    )
  );
  if (existing[0]) {
    throw new SiteInputError(
      `${rootPath(rootDirectory, SITE_CONFIG_FILENAME)} already exists on ${branch}`,
      { field: "rootDirectory" }
    );
  }
  const additions = files
    .filter((_, index) => !existing[index])
    .map((file) => ({
      path: rootPath(rootDirectory, file.path),
      content: file.content,
    }));

  const head = await getBranchHead(repository, token, branch);
  const starterBranch = starterBranchName(now);
  await createRepositoryBranch(repository, token, {
    name: starterBranch,
    sha: head.sha,
  });
  await commitRepositoryFiles(repository, token, {
    branch: starterBranch,
    headline: STARTER_COMMIT_HEADLINE,
    expectedHeadOid: head.sha,
    additions,
    deletions: [],
  });
  const pullRequestUrl = await openRepositoryPullRequest(repository, token, {
    title: STARTER_PULL_REQUEST_TITLE,
    head: starterBranch,
    base: branch,
    body: pullRequestBody(
      additions.map((file) => file.path),
      brand.websiteUrl
    ),
  });
  return { pullRequestUrl, created: true };
}
