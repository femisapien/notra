import type { DeploymentOutcome } from "../types/deployments";

export const CANCELED_OUTCOME: DeploymentOutcome = {
  kind: "skipped",
  reason: "The preview was closed while it was building.",
};

/** How many superseded production deployments stay around for rollback. */
export const ROLLBACK_HISTORY = 10;
