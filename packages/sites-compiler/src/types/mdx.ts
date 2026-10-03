import type { SiteDiagnostic } from "@notra/sites-core/types/build";
import type { ModuleDeclaration } from "estree";
import type { RootContent } from "mdast";

export interface SourceRange {
  start: number;
  end: number;
}

/** Source with the frontmatter blanked out, and the frontmatter's length. */
export interface BlankedFrontmatter {
  text: string;
  length: number;
}

export interface TextEdit {
  start: number;
  end: number;
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

export interface MdxAnalysis {
  diagnostics: SiteDiagnostic[];
  /** Transformed MDX, or null when there are errors. */
  output: string | null;
  /** Generated module holding inline components, so they can hydrate as islands. */
  inlineModule: { path: string; source: string } | null;
  /** Site-relative paths this file imports. */
  imports: string[];
}

export type EsmNode = Extract<RootContent, { type: "mdxjsEsm" }>;

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

/** What the file's import/export statements declare. */
export interface ModuleScan {
  imports: string[];
  importedNames: Set<string>;
  exportedNames: Set<string>;
  /** React components from `.jsx` snippets or inline exports; they hydrate as islands. */
  hydrated: Set<string>;
  /** Default imports of `.mdx` snippets; rendered at build time. */
  contentComponents: Set<string>;
  /** `export const X = () => …`: moved into a generated module. */
  inline: Array<{
    names: string[];
    source: string;
    node: ModuleDeclaration;
    start: number;
  }>;
  /** `export const x = "value"`: kept, and copied into the generated module. */
  valueExports: string[];
}
