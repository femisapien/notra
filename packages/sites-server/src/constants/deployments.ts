import type { DeploymentOutcome } from "../types/deployments";

export const CANCELED_OUTCOME: DeploymentOutcome = {
  kind: "skipped",
  reason: "The preview was closed while it was building.",
};

/** How many superseded production deployments stay around for rollback. */
export const ROLLBACK_HISTORY = 10;
/**
 * A deployment is marked ready before it is activated, and a crashed pipeline
 * resumes activation on retry. Cleanup leaves recent builds alone this long.
 */
export const DEPLOYMENT_SETTLE_MS = 24 * 60 * 60 * 1000;
