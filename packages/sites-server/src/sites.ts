import { db } from "@notra/db/drizzle";
import {
  githubAppInstallations,
  githubIntegrations,
  siteDeployments,
  siteDomains,
  sites,
} from "@notra/db/schema";
import {
  SITE_BUILD_LIMITS,
  SITE_DEPLOYMENT_IN_PROGRESS_STATUSES,
} from "@notra/sites-core/constants/sites";
import type { SiteMounts } from "@notra/sites-core/types/deployment";
import { hashBuildTarget } from "@notra/sites-core/utils/build-target";
import {
  branchPreviewKey,
  isValidSiteSlug,
  siteAliasHost,
  slugifySiteName,
} from "@notra/sites-core/utils/hosts";
import { normalizeSiteMounts } from "@notra/sites-core/utils/mounts";
import { and, desc, eq, inArray, or } from "drizzle-orm";

import { readLiveDeployments, restoreProductionDeployment } from "./activation";
import { deleteCustomHostnameQuietly } from "./cloudflare-saas";
import { ROLLBACK_HISTORY } from "./constants/deployments";
import {
  enqueuePreviewRemoval,
  enqueueSiteDeployment,
  getDeployment,
  getSite,
  transitionDeployment,
} from "./deployments";
import { getSitesHostingDomain } from "./env";
import {
  getBranchHead,
  requireSiteRepository,
  siteRepositoryToken,
} from "./github";
import { siteNameRejection } from "./moderation";
import { closeAllPreviews } from "./previews";
import { r2DeletePrefix, r2ListPrefixes } from "./r2";
import {
  claimHostRecord,
  mutateServingState,
  releaseHostRecord,
  setServingPreviewVisibility,
  setServingStatus,
} from "./state";
import type {
  BranchPreviewResult,
  CreateSiteInput,
  CreateSiteResult,
  DeployBranchHeadOptions,
  Site,
  SiteCleanupResult,
  SiteSettingsPatch,
  UpdateSiteSettingsResult,
} from "./types/sites";
import { buildTargetForDeployment, siteAliasOrigin } from "./urls";
import { isSafeRootDirectory } from "./utils/root-directory";

export class SiteInputError extends Error {
  readonly name = "SiteInputError";
}

async function uniqueSlug(base: string): Promise<string> {
  const root = isValidSiteSlug(base)
    ? base
    : `site-${base}`.slice(0, 32).replace(/-$/, "");
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate =
      attempt === 0
        ? root
        : `${root.slice(0, 34)}-${Math.random().toString(36).slice(2, 6)}`;
    if (!isValidSiteSlug(candidate)) {
      continue;
    }
    const [taken] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(eq(sites.slug, candidate))
      .limit(1);
    if (!taken) {
      return candidate;
    }
  }
  throw new SiteInputError(
    "Could not find a free site address; pick a different name"
  );
}

/**
 * Creates a site bound to a repository the organization already connected
 * through the GitHub App, claims its alias host and queues the first build.
 */
export async function createSite(
  input: CreateSiteInput
): Promise<CreateSiteResult> {
  const [repository] = await db
    .select({
      integration: githubIntegrations,
      installationId: githubAppInstallations.installationId,
    })
    .from(githubIntegrations)
    .innerJoin(
      githubAppInstallations,
      eq(githubIntegrations.githubAppInstallationId, githubAppInstallations.id)
    )
    .where(
      and(
        eq(githubIntegrations.id, repositoryId),
        eq(githubIntegrations.organizationId, organizationId),
        eq(githubAppInstallations.organizationId, organizationId)
      )
    )
    .limit(1);
  if (
    !(
      repository?.integration.owner &&
      repository.integration.repo &&
      repository.integration.githubRepositoryId
    )
  ) {
    throw new SiteInputError(
      "Connect the repository through the Notra GitHub App first"
    );
  }
  const rootDirectory = (input.rootDirectory ?? "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
  if (!isSafeRootDirectory(rootDirectory)) {
    throw new SiteInputError(
      "The root directory may only contain letters, digits, dots, dashes and slashes"
    );
  }
  let mounts: SiteMounts;
  try {
    mounts = normalizeSiteMounts(
      input.mounts ?? { blog: "/blog", changelog: "/changelog" }
    );
  } catch (error) {
    throw new SiteInputError((error as Error).message);
  }
  const requestedSlug = input.slug?.trim().toLowerCase();
  if (requestedSlug && !isValidSiteSlug(requestedSlug)) {
    throw new SiteInputError(
      "Use 3-40 lowercase letters, digits and single dashes for the address"
    );
  }
  const slug =
    requestedSlug ?? (await uniqueSlug(slugifySiteName(input.name) || "site"));
  const siteId = `site_${crypto.randomUUID().replaceAll("-", "")}`;
  const aliasHost = siteAliasHost(slug, getSitesHostingDomain());
  const rejection = await siteNameRejection({
    organizationId: input.organizationId,
    userId: input.userId,
    name: input.name,
    address: aliasHost,
    slug,
  });
  if (rejection) {
    throw new SiteInputError(rejection);
  }

  // Claim the hostname first: R2's create-only write is the global uniqueness check for hosts.
  await claimHostRecord(aliasHost, { siteId, kind: "alias" });
  let site: Site | undefined;
  try {
    [site] = await db
      .insert(sites)
      .values({
        id: siteId,
        organizationId: input.organizationId,
        projectId: input.projectId ?? null,
        name: input.name.trim(),
        slug,
        repositoryId: repository.integration.id,
        githubInstallationId: repository.installationId,
        githubRepositoryId: repository.integration.githubRepositoryId,
        repositoryOwner: repository.integration.owner,
        repositoryName: repository.integration.repo,
        productionBranch:
          input.productionBranch?.trim() ||
          repository.integration.defaultBranch ||
          "main",
        rootDirectory,
        publicOrigin: siteAliasOrigin(slug),
        mounts,
        previewVisibility: input.previewVisibility ?? "protected",
        publishMode: input.publishMode ?? "pull_request",
        createdByUserId: input.userId,
      })
      .returning();
  } catch (error) {
    await releaseHostRecord(aliasHost, siteId);
    throw error;
  }
  if (!site) {
    throw new Error("Could not create site");
  }
  await mutateServingState(site, (state) => ({
    write: state,
    result: undefined,
  }));
  const jobId = await deployBranchHead(site, {
    trigger: "manual",
    userId: input.userId,
  }).catch((error: unknown) => {
    console.warn(
      "sites.initial_deploy_failed",
      error instanceof Error ? error.message : error
    );
    return null;
  });
  return { site, jobId };
}

/** Builds the current head of the production branch (manual deploy / first deploy / config change). */
export async function deployBranchHead(
  site: Site,
  options: DeployBranchHeadOptions
): Promise<string> {
  const repository = requireSiteRepository(site);
  const token = await siteRepositoryToken(repository, { contents: "read" });
  const branch = options.branch ?? site.productionBranch;
  const head = await getBranchHead(repository, token, branch);
  const isPreview = Boolean(options.previewKey);
  const { jobId } = await enqueueSiteDeployment({
    siteId: site.id,
    kind: isPreview ? "preview" : "production",
    previewKey: options.previewKey ?? null,
    trigger: options.trigger,
    branch,
    commitSha: head.sha,
    commitMessage: head.message,
    commitAuthor: head.author,
    requestedByUserId: options.userId ?? null,
  });
  return jobId;
}

export async function createBranchPreview(
  site: Site,
  branch: string,
  userId: string
): Promise<BranchPreviewResult> {
  if (!site.previewsEnabled) {
    throw new SiteInputError("Previews are turned off for this site");
  }
  if (branch === site.productionBranch) {
    throw new SiteInputError("The production branch is already deployed live");
  }
  const previewKey = branchPreviewKey(branch, site.slug);
  const jobId = await deployBranchHead(site, {
    trigger: "manual",
    userId,
    branch,
    previewKey,
  });
  return { jobId, previewKey };
}

export async function deletePreview(
  site: Site,
  previewKey: string
): Promise<string> {
  return await enqueuePreviewRemoval(site.id, previewKey);
}

/** Redeploys a previous deployment's commit with the site's current settings. */
export async function redeploy(
  site: Site,
  deploymentId: string,
  userId: string
): Promise<string> {
  const [previous] = await db
    .select()
    .from(siteDeployments)
    .where(
      and(
        eq(siteDeployments.id, deploymentId),
        eq(siteDeployments.siteId, site.id)
      )
    )
    .limit(1);
  if (!previous) {
    throw new SiteInputError("Deployment not found");
  }
  const { jobId } = await enqueueSiteDeployment({
    siteId: site.id,
    kind: previous.kind,
    previewKey: previous.previewKey,
    trigger: "redeploy",
    branch: previous.branch,
    commitSha: previous.commitSha,
    commitMessage: previous.commitMessage,
    commitAuthor: previous.commitAuthor,
    pullRequestNumber: previous.pullRequestNumber,
    requestedByUserId: userId,
  });
  return jobId;
}

/**
 * Instant rollback to a stored production deployment built for the same URLs.
 * Nothing is rebuilt; see `restoreProductionDeployment`.
 */
export async function rollbackToDeployment(
  site: Site,
  deploymentId: string
): Promise<void> {
  const target = await getDeployment(deploymentId);
  if (
    !(
      target &&
      target.siteId === site.id &&
      target.kind === "production" &&
      target.status === "ready"
    )
  ) {
    throw new SiteInputError(
      "Only finished production deployments can be restored"
    );
  }
  const currentTarget = buildTargetForDeployment({
    site,
    kind: "production",
    previewKey: null,
  });
  if ((await hashBuildTarget(currentTarget)) !== target.configHash) {
    throw new SiteInputError(
      "This deployment was built for a different domain, path or branding setting. Redeploy its commit instead."
    );
  }
  if ((await restoreProductionDeployment(site, target)) !== "live") {
    throw new SiteInputError(
      "This deployment's files were already cleaned up. Redeploy its commit instead."
    );
  }
}

/** Takedown. The worker re-reads state within seconds and fails closed, edge caches included. */
export async function setSiteSuspended(
  site: Site,
  suspended: boolean,
  reason?: string
): Promise<void> {
  const status = suspended ? "suspended" : "active";
  await setServingStatus(site, status);
  await db
    .update(sites)
    .set({ status, suspendedReason: suspended ? (reason ?? null) : null })
    .where(eq(sites.id, site.id));
}

export async function updateSiteSettings(
  site: Site,
  patch: SiteSettingsPatch,
  userId: string
): Promise<UpdateSiteSettingsResult> {
  const values: Partial<typeof sites.$inferInsert> = {};
  if (patch.name !== undefined && patch.name.trim() !== site.name) {
    const rejection = await siteNameRejection({
      organizationId: site.organizationId,
      userId,
      name: patch.name.trim(),
      address: siteAliasHost(site.slug, getSitesHostingDomain()),
    });
    if (rejection) {
      throw new SiteInputError(rejection);
    }
    values.name = patch.name.trim();
  }
  if (patch.productionBranch !== undefined) {
    values.productionBranch = patch.productionBranch.trim();
  }
  if (patch.rootDirectory !== undefined) {
    const rootDirectory = patch.rootDirectory.trim().replace(/^\/+|\/+$/g, "");
    if (!isSafeRootDirectory(rootDirectory)) {
      throw new SiteInputError("Invalid root directory");
    }
    values.rootDirectory = rootDirectory;
  }
  if (patch.mounts !== undefined) {
    try {
      values.mounts = normalizeSiteMounts(patch.mounts);
    } catch (error) {
      throw new SiteInputError((error as Error).message);
    }
  }
  if (patch.previewsEnabled !== undefined) {
    values.previewsEnabled = patch.previewsEnabled;
  }
  if (patch.previewVisibility !== undefined) {
    values.previewVisibility = patch.previewVisibility;
  }
  if (patch.publishMode !== undefined) {
    values.publishMode = patch.publishMode;
  }
  if (patch.showBranding !== undefined) {
    values.showBranding = patch.showBranding;
  }
  const [updated] = await db
    .update(sites)
    .set(values)
    .where(eq(sites.id, site.id))
    .returning();
  if (!updated) {
    throw new SiteInputError("Site not found");
  }
  if (
    patch.previewVisibility &&
    patch.previewVisibility !== site.previewVisibility
  ) {
    await setServingPreviewVisibility(updated, patch.previewVisibility);
  }
  // Path, branch, root or branding changes need a new build. The current release stays live until it succeeds.
  const needsRebuild =
    (values.mounts &&
      JSON.stringify(values.mounts) !== JSON.stringify(site.mounts)) ||
    (values.productionBranch &&
      values.productionBranch !== site.productionBranch) ||
    (values.rootDirectory !== undefined &&
      values.rootDirectory !== site.rootDirectory) ||
    (values.showBranding !== undefined &&
      values.showBranding !== site.showBranding);
  const rebuildJobId = needsRebuild
    ? await deployBranchHead(updated, { trigger: "config", userId })
    : null;
  const previewRemovalJobIds =
    site.previewsEnabled && !updated.previewsEnabled
      ? await closeAllPreviews(updated)
      : [];
  return { site: updated, rebuildJobId, previewRemovalJobIds };
}

/** Switches the canonical origin (verified domain) and rebuilds; the old release serves until the new one is live. */
export async function setSitePublicOrigin(
  site: Site,
  origin: string,
  userId: string | null
): Promise<string> {
  const normalized = new URL(origin).origin;
  const [updated] = await db
    .update(sites)
    .set({ publicOrigin: normalized })
    .where(eq(sites.id, site.id))
    .returning();
  if (!updated) {
    throw new SiteInputError("Site not found");
  }
  return await deployBranchHead(updated, { trigger: "config", userId });
}

export async function deleteSite(site: Site): Promise<void> {
  await setServingStatus(site, "suspended");
  const domains = await db
    .select()
    .from(siteDomains)
    .where(eq(siteDomains.siteId, site.id));
  await releaseHostRecord(
    siteAliasHost(site.slug, getSitesHostingDomain()),
    site.id
  );
  for (const domain of domains) {
    if (domain.kind === "subdomain") {
      await releaseHostRecord(domain.hostname, site.id);
      await deleteCustomHostnameQuietly(domain.cloudflareHostnameId);
    }
  }
  await db.delete(sites).where(eq(sites.id, site.id));
  await r2DeletePrefix(`deployments/${site.id}/`);
  await r2DeletePrefix(`logs/${site.id}/`);
  await r2DeletePrefix(`sites/${site.id}/`);
}

/**
 * Deletes stored deployments nobody can reach anymore. Kept: everything the
 * serving state references (live + open previews), anything still building,
 * and the latest production deployments as rollback history.
 */
export async function cleanupSiteDeployments(
  siteId: string
): Promise<SiteCleanupResult> {
  const site = await getSite(siteId);
  if (!site) {
    return { deleted: [] };
  }
  const { ids: protectedIds } = await readLiveDeployments(site.id);
  const keep = await db
    .select({ id: siteDeployments.id })
    .from(siteDeployments)
    .where(
      and(
        eq(siteDeployments.siteId, site.id),
        or(
          inArray(siteDeployments.status, [
            ...SITE_DEPLOYMENT_IN_PROGRESS_STATUSES,
          ]),
          and(
            eq(siteDeployments.kind, "production"),
            eq(siteDeployments.status, "ready")
          )
        )
      )
    )
    .orderBy(desc(siteDeployments.generation))
    .limit(ROLLBACK_HISTORY + SITE_BUILD_LIMITS.maxConcurrentBuildsPerSite);
  for (const row of keep) {
    protectedIds.add(row.id);
  }
  const deleted: string[] = [];
  for (const prefix of await r2ListPrefixes(`deployments/${site.id}/`)) {
    const deploymentId = prefix
      .slice(`deployments/${site.id}/`.length)
      .replace(/\/$/, "");
    if (protectedIds.has(deploymentId)) {
      continue;
    }
    await r2DeletePrefix(prefix);
    await transitionDeployment(deploymentId, "expired");
    deleted.push(deploymentId);
  }
  return { deleted };
}
