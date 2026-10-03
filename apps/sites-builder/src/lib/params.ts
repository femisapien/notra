import { readFileSync } from "node:fs";

import type { BuildParams } from "../types/build-params";

const paramsPath = process.env.NOTRA_BUILD_PARAMS;
if (!paramsPath) {
  throw new Error("NOTRA_BUILD_PARAMS is not set");
}

export const params: BuildParams = JSON.parse(readFileSync(paramsPath, "utf8"));
export const config = params.config;
const basePrefix = params.mount === "/" ? "" : params.mount;
const publicFiles = new Set(params.publicFiles);

/** Path inside the current area: `href("post")` → `/blog/post`. */
export function href(path = ""): string {
  const tail = path.replace(/^\/+/, "");
  return tail ? `${basePrefix}/${tail}` : params.mount;
}

/** Absolute URL on the customer's public origin. */
export function absoluteUrl(path: string): string {
  return new URL(path, params.publicOrigin).toString();
}

/** Files from `public/` are served below the mount. Unknown absolute paths and URLs pass through. */
export function assetUrl(path: string | undefined): string | undefined {
  if (!path) {
    return undefined;
  }
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return publicFiles.has(normalized)
    ? `${basePrefix}${normalized}`
    : normalized;
}

export function areaTitle(area: BuildParams["area"]): string {
  return config[area]?.title ?? (area === "blog" ? "Blog" : "Changelog");
}

export function areaDescription(area: BuildParams["area"]): string | undefined {
  return config[area]?.description ?? config.description;
}

export function areaHref(area: BuildParams["area"]): string | null {
  if (area === params.area) {
    return href();
  }
  return params.mounts[area] ?? null;
}

/** The Markdown twin of a page: `/blog/post` → `/blog/post.md`, the area index → `/blog/index.md`. */
export function markdownHref(pagePath?: string): string {
  return pagePath ? `${pagePath}.md` : href("index.md");
}

/** llms.txt for this area; at the root mount it is the site-wide one. */
export function llmsHref(): string {
  return params.mount === "/" ? "/llms.txt" : href("llms.txt");
}
