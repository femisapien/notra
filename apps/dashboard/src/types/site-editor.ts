import type { Editor } from "@pierre/diffs/edit";

import type { SiteDiagnostic } from "@/types/sites";

export interface SiteEditorSaveState {
  status: "idle" | "dirty" | "saving" | "saved" | "error";
  error?: string;
}

/** What the status bar calls a file; `text` covers anything else. */
export type SiteEditorLanguage =
  | "mdx"
  | "markdown"
  | "json"
  | "jsx"
  | "css"
  | "text";

/** Edit the draft, or compare it with the published version. */
export type SiteEditorMode = "edit" | "changes";

/** How a draft changes the repository when it is published. */
export type SiteDraftChange = "added" | "modified" | "deleted";

export interface SiteFileTreeFile {
  path: string;
  /** Images and fonts are listed but stay in the repository. */
  editable: boolean;
  isNew: boolean;
  hasDraft: boolean;
}

/** Where the editor should put the caret after opening a file (from a diagnostic). */
export interface SiteEditorJump {
  path: string;
  line: number;
  /** Bumped per click so jumping to the same line twice still moves the caret. */
  nonce: number;
}

/** A file created from the new-file dialog. */
export interface SiteEditorNewFile {
  path: string;
  content: string;
}

/** Diagnostic attached to a line of the open file. */
export interface SiteCodeAnnotation {
  severity: SiteDiagnostic["severity"];
  message: string;
}

/** Pierre's file editor, annotated with site diagnostics. */
export type SiteFileEditor = Editor<"file", SiteCodeAnnotation>;

/** Lines added and removed across a diff's hunks. */
export interface SiteDiffLineCounts {
  additions: number;
  deletions: number;
}
