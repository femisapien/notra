import type { SiteBuildRequest } from "@notra/sites-core/types/build";

export interface BuildSiteOptions {
  toolchainRoot: string;
  siteRoot: string;
  target: SiteBuildRequest;
  outDir: string;
  workDir?: string;
}

/** The part of astro's package.json used to find its CLI entry. */
export interface AstroPackageJson {
  bin: string | Record<string, string>;
}
