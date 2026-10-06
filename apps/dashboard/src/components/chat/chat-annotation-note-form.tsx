"use client";

import { Button } from "@notra/ui/components/ui/button";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { cn } from "@notra/ui/lib/utils";
import { useState } from "react";
import { useTranslations } from "use-intl";

import type { ChatAnnotationNoteFormProps } from "@/types/components/chat-annotation-note-form";

// Enter adds, Shift+Enter breaks the line, Escape cancels. The note is
// optional: an empty one keeps the passage as a plain reference.
export function ChatAnnotationNoteForm({
  className,
  initialNote = "",
  onCancel,
  onSubmit,
  submitLabel,
}: ChatAnnotationNoteFormProps) {
  const t = useTranslations("chat.annotations");
  const [note, setNote] = useState(initialNote);

  return (
    <form
      className={cn("flex w-72 flex-col gap-1.5 p-1", className)}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(note.trim());
      }}
    >
      <Textarea
        aria-label={t("noteLabel")}
        // Focus lands after an existing note, ready to continue it.
        ref={(element) => {
          if (element && document.activeElement !== element) {
            element.focus();
            element.setSelectionRange(
              element.value.length,
              element.value.length
            );
          }
        }}
        className="max-h-32 min-h-14 resize-none"
        maxLength={500}
        onChange={(event) => setNote(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            onCancel();
          }
        }}
        placeholder={t("notePlaceholder")}
        rows={2}
        value={note}
      />
      <div className="flex justify-end gap-1">
        <Button onClick={onCancel} size="xs" type="button" variant="ghost">
          {t("cancel")}
        </Button>
        <Button size="xs" type="submit">
          {submitLabel ?? t("add")}
        </Button>
      </div>
    </form>
  );
}
