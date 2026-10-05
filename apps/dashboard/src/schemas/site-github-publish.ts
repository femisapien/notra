import { SITE_AUTHOR_ID } from "@notra/sites-core/schemas/site-config";
import { z } from "zod";

/**
 * Only the author names out of notra.json. Deliberately loose: the build
 * validates the full config, publishing must not fail on unrelated keys.
 */
export const siteConfigAuthorsSchema = z.object({
  authors: z
    .record(
      z.string().regex(SITE_AUTHOR_ID),
      z.object({ name: z.string().trim().min(1) })
    )
    .optional(),
});
