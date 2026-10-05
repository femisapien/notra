/**
 * Writes the `notra.json` JSON Schema to apps/web/public, which serves it at
 * https://usenotra.com/schemas/notra.json. Run after changing siteConfigSchema:
 *
 *   bun run generate:json-schema
 *
 * tests/json-schema.test.ts fails while the committed file is stale.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { SITE_CONFIG_JSON_SCHEMA_PATH } from "../src/constants/json-schema";
import { serializeSiteConfigJsonSchema } from "../src/utils/site-config-json-schema";

await mkdir(dirname(SITE_CONFIG_JSON_SCHEMA_PATH), { recursive: true });
await writeFile(SITE_CONFIG_JSON_SCHEMA_PATH, serializeSiteConfigJsonSchema());
console.log(`wrote ${SITE_CONFIG_JSON_SCHEMA_PATH}`);
