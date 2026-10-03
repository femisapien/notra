import {
  SITE_BUILD_LIMITS,
  SITE_R2_KEYS,
} from "@notra/sites-core/constants/sites";
import type {
  SiteManifest,
  SiteManifestFile,
} from "@notra/sites-core/types/deployment";

import { UPLOAD_CONCURRENCY } from "./constants/build";
import { r2Put } from "./r2";
import { readTarGz } from "./tar";
import type { PublishDeploymentFilesParams } from "./types/deployments";
import { mapWithConcurrency } from "./utils/concurrency";
import { contentTypeForPath } from "./utils/content-types";
import { sha256Hex } from "./utils/hash";

/**
 * Uploads the sandbox output under the deployment's immutable prefix and
 * writes the manifest last: a deployment without a manifest is incomplete and
 * is never served. The manifest is computed here, not trusted from the sandbox.
 */
export async function publishDeploymentFiles(
  params: PublishDeploymentFilesParams
): Promise<SiteManifest> {
  const { site, deployment } = params;
  const files = readTarGz(params.archive, {
    maxFiles: SITE_BUILD_LIMITS.maxOutputFiles,
    maxBytes: SITE_BUILD_LIMITS.maxOutputBytes,
    maxFileBytes: SITE_BUILD_LIMITS.maxSingleFileBytes,
  });
  if (files.length === 0) {
    throw new Error("The build produced no files");
  }
  const manifestFiles = await mapWithConcurrency(
    files,
    UPLOAD_CONCURRENCY,
    async (file): Promise<SiteManifestFile> => {
      const path = `/${file.path}`;
      const contentType = contentTypeForPath(path);
      await r2Put(SITE_R2_KEYS.file(site.id, deployment.id, path), file.data, {
        contentType,
      });
      return {
        path,
        size: file.data.byteLength,
        sha256: await sha256Hex(file.data),
        contentType,
      };
    }
  );
  const manifest: SiteManifest = {
    version: 1,
    siteId: site.id,
    deploymentId: deployment.id,
    commitSha: deployment.commitSha,
    toolchainVersion: params.toolchainVersion ?? "unknown",
    target: deployment.target,
    configHash: deployment.configHash,
    createdAt: new Date().toISOString(),
    totalBytes: manifestFiles.reduce((sum, file) => sum + file.size, 0),
    files: manifestFiles.sort((a, b) => a.path.localeCompare(b.path)),
    redirects: params.result.redirects.map((rule) => ({
      source: rule.source,
      destination: rule.destination,
      status: rule.permanent ? 308 : 307,
    })),
  };
  await r2Put(
    SITE_R2_KEYS.manifest(site.id, deployment.id),
    JSON.stringify(manifest),
    {
      contentType: "application/json; charset=utf-8",
    }
  );
  return manifest;
}
