import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, join } from "node:path";

import { parseEntryFrontmatter } from "@notra/sites-compiler/frontmatter";
import { SITE_CONFIG_FILENAME } from "@notra/sites-core/constants/sites";
import type { SiteDiagnostic } from "@notra/sites-core/types/build";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

import { OG_MANIFEST_FILE } from "../src/constants/og";
import { configuredAreaTitle, withSiteName } from "../src/utils/area-titles";
import { OgCard } from "./components/og-card";
import {
  OG_BACKGROUND_MIME_TYPES,
  OG_FONT_SUBSETS,
  OG_FONT_WEIGHTS,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  OG_IMAGES_DIR,
} from "./constants/og-images";
import type {
  OgCardContent,
  OgImagesResult,
  OgManifest,
  SatoriFont,
  WriteOgImagesParams,
} from "./types/og-images";
import { writeFileEnsured } from "./utils/fs";

let fontsPromise: Promise<SatoriFont[]> | null = null;

/**
 * Loads the bundled Inter files once per process. The same array is passed to
 * every render, which lets satori reuse its parsed fonts.
 */
function loadFonts(): Promise<SatoriFont[]> {
  fontsPromise ??= (async () => {
    // Resolved next to this module, so it works from source and from the bundled dist/cli.mjs.
    const require = createRequire(import.meta.url);
    const specs = OG_FONT_SUBSETS.flatMap((subset) =>
      OG_FONT_WEIGHTS.map((weight) => ({ subset, weight }))
    );
    return Promise.all(
      specs.map(async ({ subset, weight }) => ({
        name: `Inter ${subset}`,
        weight,
        style: "normal" as const,
        data: await readFile(
          require.resolve(
            `@fontsource/inter/files/inter-${subset}-${weight}-normal.woff`
          )
        ),
      }))
    );
  })();
  return fontsPromise;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** `thumbnails.background` as a data URI, or a warning when it cannot be used. */
async function loadBackground(
  params: WriteOgImagesParams
): Promise<{ dataUri?: string; diagnostic?: SiteDiagnostic }> {
  const path = params.config.thumbnails.background;
  if (!path) {
    return {};
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const mimeType = OG_BACKGROUND_MIME_TYPES[extname(normalized).toLowerCase()];
  // Only files the collector accepted, so the path cannot leave public/.
  if (!(mimeType && params.publicFiles.includes(normalized))) {
    return {
      diagnostic: {
        severity: "warning",
        file: SITE_CONFIG_FILENAME,
        code: "thumbnail_background",
        message: `thumbnails.background: ${path} is not a PNG, JPEG or SVG file in public/. Share images are drawn without it.`,
      },
    };
  }
  const bytes = await readFile(
    join(params.workDir, "site", "public", normalized)
  );
  return { dataUri: `data:${mimeType};base64,${bytes.toString("base64")}` };
}

async function renderPng(
  content: OgCardContent,
  fonts: SatoriFont[]
): Promise<Buffer> {
  const svg = await satori(OgCard(content), {
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    fonts,
  });
  return new Resvg(svg, {
    fitTo: { mode: "width", value: OG_IMAGE_WIDTH },
  })
    .render()
    .asPng();
}

/**
 * Draws a share image for every post and changelog entry without its own
 * frontmatter `image`, into the public dir before `astro build`, and writes
 * `og-manifest.json` so the theme knows which entries have one. The manifest
 * is always written (empty when `thumbnails.enabled` is false).
 */
export async function writeOgImages(
  params: WriteOgImagesParams
): Promise<OgImagesResult> {
  const started = Date.now();
  const manifest: OgManifest = {};
  const diagnostics: SiteDiagnostic[] = [];
  const { config } = params;
  if (config.thumbnails.enabled && params.entries.length > 0) {
    const [fonts, background] = await Promise.all([
      loadFonts(),
      loadBackground(params),
    ]);
    if (background.diagnostic) {
      diagnostics.push(background.diagnostic);
    }
    const appearance = config.thumbnails.appearance;
    const accent =
      appearance === "dark"
        ? (config.colors.light ?? config.colors.primary)
        : config.colors.primary;
    await Promise.all(
      params.entries.map(async (entry) => {
        const source = await readFile(
          join(
            params.workDir,
            "entries",
            entry.area,
            `${entry.slug}.${entry.format}`
          ),
          "utf8"
        );
        const { data } = parseEntryFrontmatter(entry.path, entry.area, source);
        if (!data || data.image || (data.draft && !params.includeDrafts)) {
          return;
        }
        const version = "version" in data ? data.version : undefined;
        const png = await renderPng(
          {
            // "Acme Blog" stays as it is; "Changelog" becomes "Acme · Changelog".
            eyebrow: withSiteName(
              config.name,
              configuredAreaTitle(config, entry.area),
              " · "
            ),
            title: data.title,
            footer: [version, formatDate(data.date)]
              .filter(Boolean)
              .join(" · "),
            appearance,
            accent,
            background: background.dataUri,
          },
          fonts
        );
        const urlPath = `/${OG_IMAGES_DIR}/${entry.area}/${entry.slug}.png`;
        await writeFileEnsured(
          join(params.workDir, "site", "public", urlPath),
          png
        );
        manifest[`${entry.area}/${entry.slug}`] = urlPath;
      })
    );
  }
  // Sorted keys keep the file stable between builds of the same content.
  const sorted = Object.fromEntries(
    Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))
  );
  await writeFileEnsured(
    join(params.workDir, OG_MANIFEST_FILE),
    `${JSON.stringify(sorted, null, 2)}\n`
  );
  return { manifest: sorted, diagnostics, durationMs: Date.now() - started };
}
