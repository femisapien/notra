import { lstat, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

import type { SiteSourceFile } from "@notra/sites-compiler/types/diagnostics";
import { SITE_BUILD_LIMITS } from "@notra/sites-core/constants/sites";
import type { SiteDiagnostic } from "@notra/sites-core/types/build";
import {
  isSiteContentPath,
  isSiteSourcePath,
} from "@notra/sites-core/utils/source-files";

import { ALLOWED_EXTENSIONS, SAFE_SEGMENT } from "./constants/source";
import type { CollectedSource, Inspected } from "./types/source";

/**
 * Lists the files a site may use: the known top-level entries in full, and
 * stylesheets and plain scripts anywhere else;
 * symlinks, dotfiles and unknown extensions are skipped so nothing outside the
 * site (or an `.env` someone committed) ever reaches the build.
 */
export async function collectSiteSource(
  siteRoot: string
): Promise<CollectedSource> {
  const files: SiteSourceFile[] = [];
  const diagnostics: SiteDiagnostic[] = [];
  let totalBytes = 0;

  // Each entry is checked on its own so a directory is stat'ed in parallel;
  // results are applied in directory order, and `files` is sorted at the end.
  async function inspect(relativePath: string): Promise<Inspected> {
    const name = relativePath.slice(relativePath.lastIndexOf("/") + 1);
    if (name.startsWith(".") || name === "node_modules") {
      return { kind: "skip" };
    }
    // Outside the content folders only stylesheets and plain scripts count;
    // everything else there is the rest of the repository, skipped quietly.
    const content = isSiteContentPath(relativePath);
    if (!(content || SAFE_SEGMENT.test(name))) {
      return { kind: "skip" };
    }
    if (!SAFE_SEGMENT.test(name)) {
      return {
        kind: "diagnostic",
        diagnostic: {
          severity: "warning",
          file: relativePath,
          code: "unsafe_filename",
          message:
            "Skipped: file names may only use letters, digits, spaces and ._-@()+",
        },
      };
    }
    const stats = await lstat(join(siteRoot, relativePath));
    if (stats.isSymbolicLink()) {
      return {
        kind: "diagnostic",
        diagnostic: {
          severity: "warning",
          file: relativePath,
          code: "symlink_skipped",
          message: "Skipped: symbolic links are not followed",
        },
      };
    }
    if (stats.isDirectory()) {
      return { kind: "directory", path: relativePath };
    }
    if (
      !stats.isFile() ||
      !ALLOWED_EXTENSIONS.has(extname(name).toLowerCase()) ||
      !isSiteSourcePath(relativePath)
    ) {
      return { kind: "skip" };
    }
    if (stats.size > SITE_BUILD_LIMITS.maxSingleFileBytes) {
      return {
        kind: "diagnostic",
        diagnostic: {
          severity: "error",
          file: relativePath,
          code: "file_too_large",
          message: `File is larger than ${SITE_BUILD_LIMITS.maxSingleFileBytes / 1024 / 1024} MB`,
        },
      };
    }
    return { kind: "file", file: { path: relativePath, size: stats.size } };
  }

  async function visit(relativePaths: string[]): Promise<void> {
    const inspected = await Promise.all(relativePaths.map(inspect));
    const directories: string[] = [];
    for (const result of inspected) {
      if (result.kind === "diagnostic") {
        diagnostics.push(result.diagnostic);
      } else if (result.kind === "directory") {
        directories.push(result.path);
      } else if (result.kind === "file") {
        totalBytes += result.file.size;
        files.push(result.file);
      }
    }
    await Promise.all(directories.map(walk));
  }

  async function walk(relativeDir: string): Promise<void> {
    const entries = await readdir(join(siteRoot, relativeDir));
    await visit(entries.map((name) => `${relativeDir}/${name}`));
  }

  // The content folders in full; elsewhere only stylesheets and plain scripts.
  await visit(await readdir(siteRoot));

  if (files.length > SITE_BUILD_LIMITS.maxSourceFiles) {
    diagnostics.push({
      severity: "error",
      file: null,
      code: "too_many_files",
      message: `The site has ${files.length} files; the limit is ${SITE_BUILD_LIMITS.maxSourceFiles}`,
    });
  }
  if (totalBytes > SITE_BUILD_LIMITS.maxSourceBytes) {
    diagnostics.push({
      severity: "error",
      file: null,
      code: "source_too_large",
      message: `The site source is ${Math.round(totalBytes / 1024 / 1024)} MB; the limit is ${SITE_BUILD_LIMITS.maxSourceBytes / 1024 / 1024} MB`,
    });
  }

  files.sort((a, b) => a.path.localeCompare(b.path));
  return { files, totalBytes, diagnostics };
}
