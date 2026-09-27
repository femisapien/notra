"use client";

import type { ComponentProps } from "react";

import { cn } from "@notra/ui/lib/utils";

import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./dialog";

interface ReleaseNoteItem {
  id: string;
  title: string;
  detail: string;
}

function ReleaseNote(props: ComponentProps<typeof Dialog>) {
  return <Dialog data-slot="release-note" {...props} />;
}

function ReleaseNoteContent({
  className,
  ...props
}: ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn("gap-0 overflow-hidden p-0 sm:max-w-xl", className)}
      data-slot="release-note-content"
      showCloseButton={false}
      {...props}
    />
  );
}

function ReleaseNoteVisual({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex min-h-48 items-center justify-center bg-muted/40 px-6 py-8",
        className
      )}
      data-slot="release-note-visual"
      {...props}
    />
  );
}

function ReleaseNoteHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("space-y-2 border-t px-5 pt-5", className)}
      data-slot="release-note-header"
      {...props}
    />
  );
}

function ReleaseNoteTitle({
  className,
  ...props
}: ComponentProps<typeof DialogTitle>) {
  return (
    <DialogTitle
      className={cn("font-semibold text-base tracking-tight", className)}
      data-slot="release-note-title"
      {...props}
    />
  );
}

function ReleaseNoteDescription({
  className,
  ...props
}: ComponentProps<typeof DialogDescription>) {
  return (
    <DialogDescription
      className={cn("text-sm leading-relaxed", className)}
      data-slot="release-note-description"
      {...props}
    />
  );
}

function ReleaseNoteFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex justify-end px-5 pt-4 pb-5", className)}
      data-slot="release-note-footer"
      {...props}
    />
  );
}

function ReleaseNoteAction({
  className,
  children = "OK",
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <DialogClose
      render={<Button className={cn("min-w-16", className)} {...props} />}
    >
      {children}
    </DialogClose>
  );
}

function ReleaseNoteStack({
  className,
  items,
  onSelect,
}: {
  className?: string;
  items: readonly ReleaseNoteItem[];
  onSelect: (id: string) => void;
}) {
  const top = items[0];
  if (!top) {
    return null;
  }

  const peeks = Math.min(items.length - 1, 2);

  return (
    <div
      className={cn(
        "relative",
        peeks > 1 && "pt-6",
        peeks === 1 && "pt-3.5",
        className
      )}
      data-slot="release-note-stack"
    >
      {peeks > 1 ? (
        <div
          aria-hidden
          className="bg-background border-border absolute inset-x-5 top-0 h-4 rounded-t-lg border border-b-0 shadow-sm"
        />
      ) : null}
      {peeks > 0 ? (
        <div
          aria-hidden
          className={cn(
            "bg-background border-border absolute inset-x-3 h-4 rounded-t-lg border border-b-0 shadow-sm",
            peeks > 1 ? "top-1.5" : "top-0"
          )}
        />
      ) : null}
      <button
        className="bg-card hover:bg-muted/40 relative z-10 w-full cursor-pointer rounded-lg px-3 py-2.5 text-left ring-1 ring-foreground/10 transition-colors"
        onClick={() => onSelect(top.id)}
        type="button"
      >
        <p className="text-sm font-medium">{top.title}</p>
        <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
          {top.detail}
        </p>
      </button>
    </div>
  );
}

export {
  ReleaseNote,
  ReleaseNoteAction,
  ReleaseNoteContent,
  ReleaseNoteDescription,
  ReleaseNoteFooter,
  ReleaseNoteHeader,
  ReleaseNoteStack,
  ReleaseNoteTitle,
  ReleaseNoteVisual,
};
export type { ReleaseNoteItem };
