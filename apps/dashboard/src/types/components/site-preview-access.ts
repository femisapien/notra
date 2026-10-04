import type { SitePreviewAccessMode } from "@/types/site-preview-access";

export interface SitePreviewAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface SitePreviewAccessFormProps {
  /** Closes the dialog (after saving or on cancel). */
  onDone: () => void;
}

export interface SitePreviewBuildToggleProps {
  id: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

export interface SitePreviewAccessModesProps {
  idPrefix: string;
  /** Previews are on; off disables the choice. */
  enabled: boolean;
  mode: SitePreviewAccessMode;
  onModeChange: (mode: SitePreviewAccessMode) => void;
}

export interface SitePreviewPasswordFieldProps {
  idPrefix: string;
  /** When the current password was set; null without one. */
  passwordSetAt: Date | string | null;
  /** Typing a new password, rather than showing the one that is set. */
  editing: boolean;
  onEdit: () => void;
  /** The new password being typed. */
  value: string;
  onChange: (value: string) => void;
  tooShort: boolean;
  showPassword: boolean;
  onToggleShowPassword: () => void;
}
