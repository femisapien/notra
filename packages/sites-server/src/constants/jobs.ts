export const DEFAULT_LEASE_MS = 15 * 60 * 1000;
/** A dispatched job that has not been claimed after this long is dispatched again. */
export const REDISPATCH_AFTER_MS = 2 * 60 * 1000;
export const RETRY_BASE_MS = 30 * 1000;
export const CAPACITY_RETRY_MS = 20 * 1000;

export const BUILDABLE_STATUSES = new Set([
  "queued",
  "building",
  "uploading",
  "ready",
]);
