import {
  SITE_DEFAULT_BLOG_PATH,
  SITE_DEFAULT_CHANGELOG_PATH,
} from "@/constants/sites";
import type { SiteCreateFormValues } from "@/types/sites";

/** A new site starts with both sections on and protected previews. */
export const SITE_CREATE_FORM_DEFAULTS: SiteCreateFormValues = {
  repositoryId: null,
  name: "",
  slug: "",
  branch: "",
  rootDirectory: "",
  blogEnabled: true,
  blogPath: SITE_DEFAULT_BLOG_PATH,
  changelogEnabled: true,
  changelogPath: SITE_DEFAULT_CHANGELOG_PATH,
  previewVisibility: "protected",
  publishMode: "pull_request",
};
