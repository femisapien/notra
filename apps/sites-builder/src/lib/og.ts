import { readFileSync } from "node:fs";
import { join } from "node:path";

import { OG_MANIFEST_FILE } from "../constants/og";
import { assetUrl, params } from "./params";

function readManifest(): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(
      readFileSync(join(params.workDir, OG_MANIFEST_FILE), "utf8")
    );
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    // No manifest: thumbnails are off, or this CLI doesn't generate them yet.
    return {};
  }
}

const manifest = readManifest();

/** The generated share image of an entry in this area, served below the mount. */
export function generatedImage(slug: string): string | undefined {
  const path = manifest[`${params.area}/${slug}`];
  // Generated images are listed in `params.publicFiles`, so assetUrl adds the mount.
  return typeof path === "string" && path.startsWith("/")
    ? assetUrl(path)
    : undefined;
}
