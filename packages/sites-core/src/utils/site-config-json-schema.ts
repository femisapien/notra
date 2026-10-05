import {
  SITE_CONFIG_FILENAME,
  SITE_CONFIG_SCHEMA_URL,
} from "@notra/sites-core/constants/sites";
import { siteConfigSchema } from "@notra/sites-core/schemas/site-config";
import { z } from "zod";

/**
 * JSON Schema of `notra.json` for editors (`"$schema": "https://usenotra.com/schemas/notra.json"`).
 * It describes what a customer writes, the input side: options with defaults
 * are optional and `appearance` accepts both its short and long form.
 */
export function buildSiteConfigJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(siteConfigSchema, {
    io: "input",
    target: "draft-2020-12",
    // Transforms and refinements are checked by the build; editors get the shape.
    unrepresentable: "any",
  });
  return {
    ...schema,
    $id: SITE_CONFIG_SCHEMA_URL,
    title: SITE_CONFIG_FILENAME,
    description:
      "Configuration of a Notra Sites blog and changelog. Every option except name is optional.",
  };
}

/** The file served at SITE_CONFIG_SCHEMA_URL, as written to disk. */
export function serializeSiteConfigJsonSchema(): string {
  return `${JSON.stringify(buildSiteConfigJsonSchema(), null, 2)}\n`;
}
