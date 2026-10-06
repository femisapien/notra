export const SITES_WEBHOOK_EVENTS = new Set([
  "push",
  "pull_request",
  "check_run",
]);
export const PREVIEW_PR_ACTIONS = new Set([
  "opened",
  "reopened",
  "synchronize",
  "ready_for_review",
]);

/** An unfinished delivery claim older than this belongs to a crashed process and can be retried. */
export const WEBHOOK_CLAIM_LEASE_SECONDS = 10 * 60;

export const BRANCH_REF_PREFIX = "refs/heads/";
/** The `after` SHA of a push that deleted its branch. */
export const ZERO_SHA = /^0+$/;
