export interface SitePreviewAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface SitePreviewAccessFormProps {
  /** Closes the dialog (after saving or on cancel). */
  onDone: () => void;
}
