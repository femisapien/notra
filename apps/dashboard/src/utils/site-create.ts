import { isValidSiteSlug } from "@notra/sites-core/utils/hosts";
import type { RepositoryContentCount } from "@notra/sites-server/types/github";
import type { SiteInputField } from "@notra/sites-server/types/sites";
import { ORPCError } from "@orpc/client";

import { SITE_CREATE_INPUT_FIELDS } from "@/constants/site-create";
import {
  SITE_DEFAULT_BLOG_PATH,
  SITE_DEFAULT_CHANGELOG_PATH,
} from "@/constants/sites";
import type {
  SiteCreateFormValues,
  SiteCreateInput,
  SiteCreateSectionPlan,
  SiteCreateTarget,
  SiteRepository,
} from "@/types/sites";

/** The address as the server will store it. */
function siteCreateSlug(form: SiteCreateFormValues): string {
  return form.slug.trim().toLowerCase();
}

/** The create call for a filled-in form; blank optional fields fall back to server defaults. */
export function siteCreateInput(
  form: SiteCreateFormValues,
  sections: SiteCreateSectionPlan,
  { organizationId, repositoryId, projectId }: SiteCreateTarget
): SiteCreateInput {
  return {
    organizationId,
    name: form.name.trim(),
    slug: siteCreateSlug(form) || undefined,
    repositoryId,
    productionBranch: form.branch.trim() || undefined,
    rootDirectory: form.rootDirectory.trim() || undefined,
    mounts: {
      blog: sections.blogPath.trim() || undefined,
      changelog: sections.changelogPath.trim() || undefined,
    },
    previewVisibility: form.previewVisibility,
    publishMode: form.publishMode,
    projectId: projectId ?? undefined,
  };
}

/** A typed address the server would reject; empty is fine (derived from the name). */
export function isSiteCreateSlugInvalid(form: SiteCreateFormValues): boolean {
  const slug = siteCreateSlug(form);
  return slug.length > 0 && !isValidSiteSlug(slug);
}

/** Named; sections are checked against the repository plan. */
function isSiteCreateFormComplete(form: SiteCreateFormValues): boolean {
  return form.name.trim().length > 0;
}

/**
 * The section paths a new site starts with. A typed path wins; otherwise a
 * section is suggested when it has posts under the root directory, and both
 * are while the repository has none yet (a fresh starter).
 */
export function siteCreateSectionPlan(
  form: SiteCreateFormValues,
  contentCounts: Record<string, RepositoryContentCount> | undefined
): SiteCreateSectionPlan {
  const root = form.rootDirectory.trim().replace(/^\/+|\/+$/g, "");
  const counts = contentCounts
    ? (contentCounts[root] ?? { blog: 0, changelog: 0 })
    : null;
  const hasContent = Boolean(
    counts && (counts.blog > 0 || counts.changelog > 0)
  );
  const suggested = (posts: number | undefined, path: string) =>
    !hasContent || (posts ?? 0) > 0 ? path : "";
  return {
    blogPath: form.blogPath ?? suggested(counts?.blog, SITE_DEFAULT_BLOG_PATH),
    changelogPath:
      form.changelogPath ??
      suggested(counts?.changelog, SITE_DEFAULT_CHANGELOG_PATH),
    counts,
  };
}

/** At least one section has a path. */
export function hasSiteCreateSection(plan: SiteCreateSectionPlan): boolean {
  return Boolean(plan.blogPath.trim() || plan.changelogPath.trim());
}

/** Picking a repository starts on its default branch and names the site after it. */
export function withSiteRepository(
  form: SiteCreateFormValues,
  repository: SiteRepository
): SiteCreateFormValues {
  return {
    ...form,
    repositoryId: repository.id,
    branch: repository.defaultBranch ?? "",
    name: form.name.trim() ? form.name : (repository.repo ?? ""),
    // A new repository suggests its own sections again.
    blogPath: null,
    changelogPath: null,
  };
}

/** The branch the first build will use; null until a repository (with a branch) is picked. */
function siteCreateProductionBranch(
  form: SiteCreateFormValues,
  repository: SiteRepository | null
): string | null {
  if (!repository) {
    return null;
  }
  return form.branch.trim() || repository.defaultBranch || null;
}

/** Everything the create call needs: a repository, a name, a valid address and a branch. */
export function isSiteCreateReady(
  form: SiteCreateFormValues,
  repository: SiteRepository | null
): boolean {
  return (
    repository !== null &&
    isSiteCreateFormComplete(form) &&
    !isSiteCreateSlugInvalid(form) &&
    siteCreateProductionBranch(form, repository) !== null
  );
}

function isSiteInputField(value: unknown): value is SiteInputField {
  return (
    typeof value === "string" &&
    (SITE_CREATE_INPUT_FIELDS as readonly string[]).includes(value)
  );
}

/**
 * The field a failed create call is about. Rejections carry it; a conflict on
 * create can only be the address, which another site already claimed.
 */
export function siteCreateErrorField(error: unknown): SiteInputField | null {
  if (!(error instanceof ORPCError)) {
    return null;
  }
  const { data } = error;
  const field =
    typeof data === "object" && data !== null && "field" in data
      ? data.field
      : undefined;
  if (isSiteInputField(field)) {
    return field;
  }
  return error.code === "CONFLICT" ? "slug" : null;
}
