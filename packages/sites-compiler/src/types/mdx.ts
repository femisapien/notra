import type { SiteDiagnostic } from "@notra/sites-core/types/build";
import type { ModuleDeclaration } from "estree";
import type { RootContent } from "mdast";

import type { SourceRange } from "./estree";

/** Source with the frontmatter blanked out, and the frontmatter's length. */
export interface BlankedFrontmatter {
  text: string;
  length: number;
}

export interface TextEdit extends SourceRange {
  text: string;
}

export interface MdxAnalysisContext {
  /** Every file of the site, site-relative. */
  files: ReadonlySet<string>;
  /** Named exports of each `.jsx`/`.js` snippet, for import checks. */
  componentExports: ReadonlyMap<string, readonly string[]>;
  /** Entries (blog posts, changelog entries) get frontmatter; snippets get `{prop}` rewriting. */
  isEntry: boolean;
}

/** Generated module holding inline components, so they can hydrate as islands. */
export interface InlineModule {
  path: string;
  source: string;
}

export interface MdxAnalysis {
  diagnostics: SiteDiagnostic[];
  /** Transformed MDX, or null when there are errors. */
  output: string | null;
  inlineModule: InlineModule | null;
  /** Site-relative paths this file imports. */
  imports: string[];
}

export type EsmNode = Extract<RootContent, { type: "mdxjsEsm" }>;

export type MdxJsxElement = Extract<
  RootContent,
  { type: "mdxJsxFlowElement" | "mdxJsxTextElement" }
>;

/** Shared state of one file's analysis: where errors and text edits are collected. */
export interface MdxPass {
  path: string;
  source: string;
  /** Source with the frontmatter blanked, so parser offsets are absolute. */
  text: string;
  context: MdxAnalysisContext;
  diagnostics: SiteDiagnostic[];
  edits: TextEdit[];
}

/** `export const X = () => …`: moved into a generated module. */
export interface InlineComponent {
  names: string[];
  source: string;
  node: ModuleDeclaration;
  start: number;
}

/** What the file's import/export statements declare. */
export interface ModuleScan {
  imports: string[];
  importedNames: Set<string>;
  exportedNames: Set<string>;
  /** React components from `.jsx` snippets or inline exports; they hydrate as islands. */
  hydrated: Set<string>;
  /** Default imports of `.mdx` snippets; rendered at build time. */
  contentComponents: Set<string>;
  inline: InlineComponent[];
  /** `export const x = "value"`: kept, and copied into the generated module. */
  valueExports: string[];
}
