"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@notra/ui/components/ui/sheet";
import { useTranslations } from "next-intl";

import type { SiteEditorFilePickerProps } from "@/types/components/site-editor";

/** The file tree in a sheet, for screens too narrow for the sidebar. */
export function SiteEditorFilePicker({
  open,
  onOpenChange,
  children,
}: SiteEditorFilePickerProps) {
  const t = useTranslations("sites.editorPage");
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="gap-0 p-0"
        // On touch, focusing the filter would pop the keyboard over the tree.
        initialFocus={(openType) => openType !== "touch"}
        side="left"
      >
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-sm">{t("tree.title")}</SheetTitle>
        </SheetHeader>
        <div className="bg-shell flex min-h-0 flex-1 flex-col">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
