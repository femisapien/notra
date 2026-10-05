import { SITE_R2_KEYS } from "@notra/sites-core/constants/sites";

import { activateDeployment } from "./activation";
import { runSandboxBuild } from "./box-build";
import { CANCELED_OUTCOME } from "./constants/deployments";
import {
  getDeployment,
  hasNewerDeployment,
  transitionDeployment,
} from "./deployments";
import {
  downloadRepositoryTarball,
  getBranchHead,
  requireSiteRepository,
  siteRepositoryToken,
} from "./github";
import { publishDeploymentFiles } from "./publish";
import { r2Put } from "./r2";
import { openCheckRun, reportOutcome } from "./reporting";
import type { DeploymentOutcome, SiteDeployment } from "./types/deployments";
import type { Site } from "./types/sites";
import { summarizeDiagnostics } from "./utils/diagnostics";

/** The same object is overwritten while the build runs, so the dashboard can tail it. */
async function writeBuildLog(
  siteId: string,
  deploymentId: string,
  log: string
) {
  await r2Put(SITE_R2_KEYS.buildLog(siteId, deploymentId), log, {
    contentType: "text/plain; charset=utf-8",
  });
}

/** The commit `branch` points at now; null when the branch is gone. */
async function currentBranchHead(
  site: Site,
  branch: string,
  token: string
): Promise<string | null> {
  const head = await getBranchHead(
    requireSiteRepository(site),
    token,
    branch
  ).catch((error: unknown) => {
    if ((error as { status?: number }).status === 404) {
      return null;
    }
    throw error;
  });
  return head?.sha ?? null;
}

/**
 * Webhooks arrive late, out of order or redelivered. A push/PR build whose
 * commit is no longer its branch head would publish older content under a
 * newer generation; the push that moved the branch has its own deployment.
 * The head is checked first, so a late webhook for an older commit (which
 * gets a higher generation) skips itself instead of displacing the build of
 * the current head.
 */
async function whyNotBuild(
  site: Site,
  deployment: SiteDeployment,
  token: string
): Promise<string | null> {
  if (deployment.status !== "queued") {
    return null;
  }
  const head = await currentBranchHead(site, deployment.branch, token);
  const fromWebhook =
    deployment.trigger === "push" || deployment.trigger === "pull_request";
  if (fromWebhook && head !== deployment.commitSha) {
    return head
      ? `${deployment.branch} moved on to ${head.slice(0, 7)}.`
      : `${deployment.branch} no longer exists.`;
  }
  if (await hasNewerDeployment(deployment, head)) {
    return "A newer deployment replaces this one.";
  }
  return null;
}

/**
 * Sandbox build + upload. Returns an outcome when the deployment ends here
 * (skipped, failed, canceled meanwhile); null when it is `ready` to go live.
 * Every status change is a guarded transition, so a concurrent cancel always wins.
 */
async function buildAndPublish(
  site: Site,
  deployment: SiteDeployment
): Promise<DeploymentOutcome | null> {
  if (site.status !== "active") {
    await transitionDeployment(deployment.id, "canceled", {
      finishedAt: new Date(),
      errorMessage: "Site is suspended",
    });
    return { kind: "skipped", reason: "The site is offline." };
  }
  const repository = requireSiteRepository(site);
  const token = await siteRepositoryToken(repository, { contents: "read" });
  const skipReason = await whyNotBuild(site, deployment, token);
  if (skipReason) {
    await transitionDeployment(deployment.id, "superseded", {
      finishedAt: new Date(),
      errorMessage: skipReason,
    });
    return { kind: "skipped", reason: skipReason };
  }
  if (
    !(await transitionDeployment(deployment.id, "building", {
      startedAt: deployment.startedAt ?? new Date(),
    }))
  ) {
    return CANCELED_OUTCOME;
  }

  const sourceArchive = await downloadRepositoryTarball(
    repository,
    token,
    deployment.commitSha
  );
  const build = await runSandboxBuild({
    sourceArchive,
    rootDirectory: site.rootDirectory,
    target: {
      siteId: site.id,
      deploymentId: deployment.id,
      commitSha: deployment.commitSha,
      publicOrigin: deployment.target.publicOrigin,
      mounts: deployment.target.mounts,
      noindex: deployment.target.noindex,
      includeDrafts: deployment.kind === "preview",
      // Rows from before the setting carry no flag; they were built with the badge.
      branding: deployment.target.branding !== false,
    },
    onLog: (log) => writeBuildLog(site.id, deployment.id, log),
  });
  await writeBuildLog(site.id, deployment.id, build.log).catch(() => undefined);

  const result = build.result;
  if (!(result?.ok && build.outputArchive)) {
    const diagnostics = result?.diagnostics ?? [
      {
        severity: "error" as const,
        file: null,
        code: "build_crashed",
        message: build.crash ?? "The build failed.",
      },
    ];
    const summary = summarizeDiagnostics(diagnostics);
    await transitionDeployment(deployment.id, "failed", {
      finishedAt: new Date(),
      diagnostics,
      errorMessage: summary.slice(0, 4000),
      buildDurationMs: build.durationMs,
      toolchainVersion: build.toolchainVersion,
    });
    return { kind: "failed", summary, diagnostics };
  }

  if (!(await transitionDeployment(deployment.id, "uploading"))) {
    return CANCELED_OUTCOME;
  }
  const manifest = await publishDeploymentFiles({
    site,
    deployment,
    archive: build.outputArchive,
    result,
    toolchainVersion: build.toolchainVersion,
  });
  const ready = await transitionDeployment(deployment.id, "ready", {
    fileCount: manifest.files.length,
    totalBytes: manifest.totalBytes,
    buildDurationMs: build.durationMs,
    toolchainVersion: build.toolchainVersion,
    diagnostics: result.diagnostics,
    finishedAt: new Date(),
  });
  return ready ? null : CANCELED_OUTCOME;
}

/**
 * One deployment, start to finish: decide → build → publish → activate → report.
 * Resumable: a deployment that crashed after its upload (`ready`) skips straight to activation.
 */
export async function runDeploymentPipeline(
  site: Site,
  queued: SiteDeployment
): Promise<DeploymentOutcome> {
  const deployment = await openCheckRun(site, queued);
  const ended =
    deployment.status === "ready"
      ? null
      : await buildAndPublish(site, deployment);
  const finished = (await getDeployment(deployment.id)) ?? deployment;
  let outcome: DeploymentOutcome;
  if (ended) {
    outcome = ended;
  } else if (
    site.status === "active" &&
    (await activateDeployment(site, finished)) === "live"
  ) {
    outcome = { kind: "live" };
  } else {
    outcome = { kind: "not_live" };
  }
  await reportOutcome(site, finished, outcome);
  return outcome;
}

/** Final failure outside the build itself (crash on the last attempt, permanent error). */
export async function failDeployment(
  site: Site,
  deployment: SiteDeployment,
  message: string
): Promise<void> {
  if (
    !(await transitionDeployment(deployment.id, "failed", {
      finishedAt: new Date(),
      errorMessage: message.slice(0, 4000),
    }))
  ) {
    return;
  }
  await reportOutcome(site, deployment, {
    kind: "failed",
    summary: message,
    diagnostics: [],
  });
}
