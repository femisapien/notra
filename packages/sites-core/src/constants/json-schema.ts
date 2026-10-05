import { fileURLToPath } from "node:url";

/** Where the generated `notra.json` schema lives in the repo: apps/web serves `public/` at the root. */
export const SITE_CONFIG_JSON_SCHEMA_PATH = fileURLToPath(
  new URL("../../../../apps/web/public/schemas/notra.json", import.meta.url)
);
