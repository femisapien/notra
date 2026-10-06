import { db } from "@notra/db/drizzle";
import { SITE_R2_KEYS } from "@notra/sites-core/constants/sites";
import type {
  PreviewActivationResult,
  ProductionActivationResult,
} from "@notra/sites-core/types/serving-state";
import { referencedDeploymentIds } from "@notra/sites-core/utils/serving-state";

import { allocateGeneration } from "./deployments";
import { r2GetText } from "./r2";
import {
  activatePreviewDeployment,
  activateProductionDeployment,
  readServingState,
} from "./state";
import type {
  ActivationOutcome,
  LiveDeployments,
  SiteDeployment,
} from "./types/deployments";
import type { Site } from "./types/sites";

/**
 * Cleanup may have removed the files of a build that sat ready for long;
 * pointing the state at them would serve errors.
 */
async function hasStoredFiles(
  site: Site,
  deployment: SiteDeployment
): Promise<boolean> {
  return Boolean(
    await r2GetText(SITE_R2_KEYS.manifest(site.id, deployment.id))
  );
}

function liveUnlessSuperseded(
  outcome: ProductionActivationResult | PreviewActivationResult
): ActivationOutcome {
  return outcome.outcome === "superseded" ? "not_live" : "live";
}

/**
 * Points the serving state at a finished deployment. The R2 state is the only
 * record of what is live; nothing is mirrored into the database, so there is
 * no second copy that could disagree after a crash.
 */
export async function activateDeployment(
  site: Site,
  deployment: SiteDeployment
): Promise<ActivationOutcome> {
  if (!(await hasStoredFiles(site, deployment))) {
    return "not_live";
  }
  if (deployment.kind === "production") {
    return liveUnlessSuperseded(
      await activateProductionDeployment(site, {
        deploymentId: deployment.id,
        generation: deployment.generation,
      })
    );
  }
  if (!deployment.previewKey) {
    throw new Error("Preview deployment without a preview key");
  }
  return liveUnlessSuperseded(
    await activatePreviewDeployment(site, deployment.previewKey, {
      deploymentId: deployment.id,
      sequence: deployment.generation,
      visibility: site.previewVisibility,
      expiresAt: null,
    })
  );
}

/**
 * Instant rollback to a stored production deployment. It takes a fresh
 * generation, so builds that were already running cannot override it later.
 */
export async function restoreProductionDeployment(
  site: Site,
  deployment: SiteDeployment
): Promise<ActivationOutcome> {
  if (!(await hasStoredFiles(site, deployment))) {
    return "not_live";
  }
  const { lastGeneration } = await allocateGeneration(db, site.id);
  return liveUnlessSuperseded(
    await activateProductionDeployment(site, {
      deploymentId: deployment.id,
      generation: lastGeneration,
    })
  );
}

/** What the site serves right now: every open preview, and the ids of all referenced deployments. */
export async function readLiveDeployments(
  siteId: string
): Promise<LiveDeployments> {
  const serving = await readServingState(siteId);
  return {
    previews: serving?.state.previews ?? {},
    ids: serving ? referencedDeploymentIds(serving.state) : new Set(),
  };
}
