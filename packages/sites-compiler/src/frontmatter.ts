import {
  blogFrontmatterSchema,
  changelogFrontmatterSchema,
} from "@notra/sites-core/schemas/site-config";
import { parse as parseYaml } from "yaml";

import { FRONTMATTER_BLOCK } from "./constants/frontmatter";
import type { SiteEntry } from "./types/diagnostics";
import type { ParsedFrontmatter } from "./types/frontmatter";

/**
 * Parses and checks a post's or changelog entry's frontmatter. Used by
 * validation and by build steps that need the data before Astro runs
 * (share images).
 */
export function parseEntryFrontmatter(
  path: string,
  area: SiteEntry["area"],
  source: string
): ParsedFrontmatter {
  const yaml = FRONTMATTER_BLOCK.exec(source)?.[1];
  if (yaml === undefined) {
    return {
      data: null,
      diagnostics: [
        {
          severity: "error",
          file: path,
          line: 1,
          code: "frontmatter_missing",
          message:
            "Missing frontmatter. Start the file with ---, a title and a date, then ---.",
        },
      ],
    };
  }
  let raw: unknown;
  try {
    raw = parseYaml(yaml) ?? {};
  } catch (error) {
    return {
      data: null,
      diagnostics: [
        {
          severity: "error",
          file: path,
          line: 1,
          code: "frontmatter_yaml",
          message: `Frontmatter is not valid YAML: ${(error as Error).message.split("\n")[0]}`,
        },
      ],
    };
  }
  const schema =
    area === "blog" ? blogFrontmatterSchema : changelogFrontmatterSchema;
  const parsed = schema.safeParse(raw);
  if (parsed.success) {
    return { data: parsed.data, diagnostics: [] };
  }
  return {
    data: null,
    diagnostics: parsed.error.issues.map((issue) => ({
      severity: "error" as const,
      file: path,
      line: 1,
      code: "frontmatter_invalid",
      message: `Frontmatter ${issue.path.join(".") || "value"}: ${issue.message}`,
    })),
  };
}
