import type {
  blogFrontmatterSchema,
  changelogFrontmatterSchema,
} from "@notra/sites-core/schemas/site-config";
import type { SiteDiagnostic } from "@notra/sites-core/types/build";
import type { z } from "zod";

export type EntryFrontmatter =
  | z.infer<typeof blogFrontmatterSchema>
  | z.infer<typeof changelogFrontmatterSchema>;

export interface ParsedFrontmatter {
  /** Null when the frontmatter is missing or invalid; `diagnostics` says why. */
  data: EntryFrontmatter | null;
  diagnostics: SiteDiagnostic[];
}
