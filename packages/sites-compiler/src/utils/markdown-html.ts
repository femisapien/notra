import type { SiteDiagnostic } from "@notra/sites-core/types/build";
import { fromMarkdown } from "mdast-util-from-markdown";
import { visit } from "unist-util-visit";

import { BLOCKED_HTML_ELEMENTS } from "../constants/elements";
import { offsetToLineColumn } from "./paths";

/**
 * Plain Markdown passes raw HTML through untouched, so blocked elements are
 * checked on its HTML nodes; code blocks are other node types and stay free.
 */
export function blockedMarkdownHtml(
  path: string,
  source: string
): SiteDiagnostic[] {
  const diagnostics: SiteDiagnostic[] = [];
  const tree = fromMarkdown(source);
  visit(tree, "html", (node) => {
    for (const match of node.value.matchAll(/<\s*([a-z][a-z0-9-]*)/gi)) {
      const tag = match[1]?.toLowerCase() ?? "";
      if (BLOCKED_HTML_ELEMENTS.has(tag)) {
        diagnostics.push({
          severity: "error",
          code: "blocked_element",
          file: path,
          message: `<${tag}> is not allowed in content. Put JavaScript in script.js or scripts/*.js.`,
          ...offsetToLineColumn(
            source,
            (node.position?.start.offset ?? 0) + (match.index ?? 0)
          ),
        });
      }
    }
  });
  return diagnostics;
}
