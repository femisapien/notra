import { isValidSiteSlug } from "@notra/sites-core/utils/hosts";
import type { SiteInputField } from "@notra/sites-server/types/sites";
import { ORPCError } from "@orpc/client";

import { SITE_CREATE_INPUT_FIELDS } from "@/constants/site-create";
import type {
  SiteCreateFormValues,
  SiteCreateInput,
  SiteCreateTarget,
  SiteRepository,
} from "@/types/sites";

/** `owner/repo`, as the repository picker lists it. */
export function siteRepositoryLabel(repository: SiteRepository): string {
  return `${repository.owner ?? ""}/${repository.repo ?? ""}`;
}

/** The address as the server will store it. */
export function siteCreateSlug(form: SiteCreateFormValues): string {
  return form.slug.trim().toLowerCase();
}

/** The create call for a filled-in form; blank optional fields fall back to server defaults. */
export function siteCreateInput(
  form: SiteCreateFormValues,
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
      blog: form.blogEnabled ? form.blogPath : undefined,
      changelog: form.changelogEnabled ? form.changelogPath : undefined,
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

/** Named, with at least one section on. */
export function isSiteCreateFormComplete(form: SiteCreateFormValues): boolean {
  return (
    form.name.trim().length > 0 && (form.blogEnabled || form.changelogEnabled)
  );
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
  };
}

/** The branch the first build will use; null until a repository (with a branch) is picked. */
export function siteCreateProductionBranch(
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
