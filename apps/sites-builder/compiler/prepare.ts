import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { SiteEntry } from "@notra/sites-compiler/types/diagnostics";
import { isTextSourceFile, validateSite } from "@notra/sites-compiler/validate";

import { collectSiteSource } from "./collect";
import type { PreparedSite, PrepareSiteParams } from "./types/source";
import { writeFileEnsured } from "./utils/fs";

export async function readSiteFiles(siteRoot: string) {
  const collected = await collectSiteSource(siteRoot);
  const files = new Map<string, string | null>();
  for (const file of collected.files) {
    files.set(
      file.path,
      isTextSourceFile(file.path)
        ? await readFile(join(siteRoot, file.path), "utf8")
        : null
    );
  }
  return { collected, files };
}

/**
 * Validates the customer site and lays it out for Astro:
 * `work/site/**` mirrors the repo (with transformed MDX/JSX) and is what `@site/…`
 * imports resolve to; `work/entries/<area>/<slug>.mdx` holds only real entries.
 * Drafts are copied too; the theme hides them unless the build includes drafts.
 */
export async function prepareSite(
  params: PrepareSiteParams
): Promise<PreparedSite> {
  const { collected, files } = await readSiteFiles(params.siteRoot);
  const validation = validateSite({ files });
  const publicFiles = collected.files
    .filter((file) => file.path.startsWith("public/"))
    .map((file) => file.path.slice("public".length));

  if (!validation.ok) {
    return {
      validation,
      collectDiagnostics: collected.diagnostics,
      publicFiles,
      entries: [],
    };
  }

  await rm(join(params.workDir, "site"), { recursive: true, force: true });
  await rm(join(params.workDir, "entries"), { recursive: true, force: true });

  for (const file of collected.files) {
    const target = join(params.workDir, "site", file.path);
    const transformed = validation.outputs.get(file.path);
    if (transformed !== undefined) {
      await writeFileEnsured(target, transformed);
    } else {
      await mkdir(dirname(target), { recursive: true });
      await cp(join(params.siteRoot, file.path), target);
    }
  }
  for (const [path, source] of validation.outputs) {
    if (!files.has(path)) {
      await writeFileEnsured(join(params.workDir, "site", path), source);
    }
  }

  // Customer CSS (Mintlify's style.css), imported after the theme so it can override it.
  const customCss = collected.files
    .filter(
      (file) =>
        file.path.endsWith(".css") &&
        (file.path === "style.css" || file.path.startsWith("styles/"))
    )
    .map(
      (file) =>
        `@import ${JSON.stringify(join(params.workDir, "site", file.path))};`
    )
    .join("\n");
  await writeFileEnsured(join(params.workDir, "custom.css"), `${customCss}\n`);

  const entries: SiteEntry[] = [];
  for (const entry of validation.entries) {
    const source =
      validation.outputs.get(entry.path) ?? files.get(entry.path) ?? "";
    await writeFileEnsured(
      join(
        params.workDir,
        "entries",
        entry.area,
        `${entry.slug}.${entry.format}`
      ),
      source
    );
    entries.push(entry);
  }

  return {
    validation,
    collectDiagnostics: collected.diagnostics,
    publicFiles,
    entries,
  };
}
