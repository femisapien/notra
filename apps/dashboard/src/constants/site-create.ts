import type { SiteInputField } from "@notra/sites-server/types/sites";
import { TRANSITION } from "@notra/ui/lib/motion";
import type { Variants } from "motion/react";

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

/** Fields the server can reject; errors name one of them. */
export const SITE_CREATE_INPUT_FIELDS: readonly SiteInputField[] = [
  "repository",
  "name",
  "slug",
  "rootDirectory",
  "sections",
];

/** The id suffix of the input that gets focus when the server rejects its field. */
export const SITE_CREATE_FIELD_INPUT_SUFFIXES: Partial<
  Record<SiteInputField, string>
> = {
  name: "name",
  slug: "slug",
  rootDirectory: "root",
};

/** Which server error a form value clears once it is edited. */
export const SITE_CREATE_VALUE_FIELDS: Partial<
  Record<keyof SiteCreateFormValues, SiteInputField>
> = {
  repositoryId: "repository",
  name: "name",
  slug: "slug",
  rootDirectory: "rootDirectory",
  blogEnabled: "sections",
  blogPath: "sections",
  changelogEnabled: "sections",
  changelogPath: "sections",
};

/** The new-site steps, top to bottom on the stage. */
export const SITE_CREATE_STEP_IDS = [
  "repository",
  "configure",
  "deploy",
] as const;

/** How often the deploy step asks whether the first deployment exists yet. */
export const SITE_CREATE_DEPLOY_POLL_MS = 1500;

export const SITE_IMPORT_SKELETON_ROWS = 5;

/** Focus moves into a step once the stage has glided it into place. */
export const SITE_CREATE_FOCUS_DELAY_MS = 600;

/** The settings' rows rise in one after another once a repository is imported. */
export const SITE_CREATE_CONFIG_VARIANTS: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.04, delayChildren: 0.15 } },
};

/** One row of the settings rising into place. */
export const SITE_CREATE_ROW_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 6 },
  shown: { opacity: 1, y: 0, transition: TRANSITION.enter },
};

/** The starter check waits for the branch and folder to settle instead of asking GitHub per keystroke. */
export const SITE_CREATE_STARTER_DEBOUNCE_MS = 400;
/** The config-missing build diagnostic; the deploy card points at the starter pull request for it. */
export const SITE_CONFIG_MISSING_DIAGNOSTIC = "config_missing";
