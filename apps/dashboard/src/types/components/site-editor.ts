import type {
  SiteCodeAnnotation,
  SiteDraftChange,
  SiteEditorJump,
  SiteEditorLanguage,
  SiteEditorMode,
  SiteEditorSaveState,
  SiteFileTreeFile,
} from "@/types/site-editor";
import type {
  SiteDiagnostic,
  SiteEditorDocument,
  SiteRecord,
} from "@/types/sites";

export interface SiteFileTreeProps {
  files: readonly SiteFileTreeFile[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  isLoading: boolean;
}

export interface SiteCodeEditorProps {
  path: string;
  /** Read once when the editor mounts; later edits stay inside the editor. */
  initialValue: string;
  label: string;
  editStateKey: string;
  diagnostics: readonly SiteDiagnostic[];
  jump: SiteEditorJump | null;
  onChange: (value: string) => void;
  onSave: () => void;
}

export interface SiteCodeAnnotationRowProps {
  annotation: SiteCodeAnnotation;
}

export interface SiteFileDiffProps {
  path: string;
  /** Null when the file doesn't exist on that side (new or deleted). */
  before: string | null;
  after: string | null;
  className?: string;
}

export interface SiteEditorPaneProps {
  organizationId: string;
  siteId: string;
  site: SiteRecord;
  path: string;
  baseCommitSha: string | null;
  diagnostics: readonly SiteDiagnostic[];
  jump: SiteEditorJump | null;
  /** A draft landed (`updatedAt`) or was discarded (`null`). */
  onDraftChange: (path: string, updatedAt: Date | null) => void;
  onSaveStateChange: (state: SiteEditorSaveState) => void;
  onOpenFilePicker?: () => void;
}

export interface SiteEditorFileBarProps {
  site: SiteRecord;
  path: string;
  document: SiteEditorDocument | null;
  saveState: SiteEditorSaveState;
  hasDraft: boolean;
  isDiscarding: boolean;
  mode: SiteEditorMode;
  onModeChange: (mode: SiteEditorMode) => void;
  onDiscard: () => void;
  onOpenFilePicker?: () => void;
}

export interface SiteEditorSaveErrorProps {
  /** The failed save's message, shown on hover. */
  error: string | undefined;
}

export interface SiteEditorStatusBarProps {
  language: SiteEditorLanguage | null;
  diagnostics: SiteDiagnostic[] | null;
  isValidating: boolean;
  problemsOpen: boolean;
  onToggleProblems: () => void;
}

export interface SiteEditorProblemsProps {
  diagnostics: SiteDiagnostic[];
  onSelect: (diagnostic: SiteDiagnostic) => void;
  onClose: () => void;
}

export interface SiteEditorConflictBannerProps {
  paths: string[];
  isRebasing: boolean;
  onSelect: (path: string) => void;
  onRebase: () => void;
  onDismiss: () => void;
}

export interface SitePublishChangeProps {
  organizationId: string;
  siteId: string;
  path: string;
  change: SiteDraftChange;
  /** The first change opens so the dialog shows a diff right away. */
  defaultOpen: boolean;
}
