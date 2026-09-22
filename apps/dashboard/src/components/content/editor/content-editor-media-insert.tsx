"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Film, ImagePlus } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/components/button";
import type { EditorRefHandle } from "@/components/content/editor/plugins/editor-ref-plugin";
import {
  OPEN_CONTENT_IMAGE_UPLOAD_COMMAND,
  OPEN_CONTENT_VIDEO_UPLOAD_COMMAND,
} from "@/components/content/editor/plugins/image-upload-plugin";

export function ContentEditorMediaInsert({
  editorRef,
}: {
  editorRef: RefObject<EditorRefHandle | null>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Add image or video"
            className="mt-1 shrink-0 md:mt-1.5"
            size="icon-sm"
            variant="ghost"
          />
        }
      >
        <HugeiconsIcon
          aria-hidden="true"
          className="text-muted-foreground group-hover/button:text-foreground size-4"
          icon={PlusSignIcon}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem
          onClick={() => {
            editorRef.current?.dispatchCommand(
              OPEN_CONTENT_IMAGE_UPLOAD_COMMAND,
              undefined
            );
          }}
        >
          <ImagePlus className="size-4" />
          Image
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editorRef.current?.dispatchCommand(
              OPEN_CONTENT_VIDEO_UPLOAD_COMMAND,
              undefined
            );
          }}
        >
          <Film className="size-4" />
          Video
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
