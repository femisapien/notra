"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DROP_COMMAND,
  type LexicalCommand,
  type LexicalEditor,
  type LexicalNode,
  PASTE_COMMAND,
} from "lexical";
import { Film, ImagePlus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  CONTENT_IMAGE_MIME_EXTENSIONS,
  MAX_CONTENT_IMAGE_INPUT_BYTES,
} from "@/constants/content-image";
import {
  CONTENT_VIDEO_MIME_EXTENSIONS,
  MAX_CONTENT_VIDEO_BYTES,
} from "@/constants/content-video";
import { uploadContentImage, uploadContentVideo } from "@/lib/upload/client";

import { $createContentImageNode } from "../nodes/content-image-node";
import { $createContentVideoNode } from "../nodes/content-video-node";

export const OPEN_CONTENT_IMAGE_UPLOAD_COMMAND: LexicalCommand<void> =
  createCommand("OPEN_CONTENT_IMAGE_UPLOAD_COMMAND");

export const OPEN_CONTENT_VIDEO_UPLOAD_COMMAND: LexicalCommand<void> =
  createCommand("OPEN_CONTENT_VIDEO_UPLOAD_COMMAND");

const ACCEPTED_IMAGE_TYPES = Object.keys(CONTENT_IMAGE_MIME_EXTENSIONS).join(
  ","
);

function altFromFileName(name: string) {
  const base = name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/[[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return base || "Image";
}

function isVideoFile(file: File) {
  return (
    file.type in CONTENT_VIDEO_MIME_EXTENSIONS ||
    /\.(mp4|webm)$/i.test(file.name)
  );
}

function isImageFile(file: File) {
  if (isVideoFile(file)) {
    return false;
  }
  return (
    file.type === "" ||
    file.type in CONTENT_IMAGE_MIME_EXTENSIONS ||
    file.type.startsWith("image/")
  );
}

function mediaFiles(list: FileList | null | undefined) {
  if (!list) {
    return [];
  }
  return [...list].filter((file) => isVideoFile(file) || isImageFile(file));
}

function placeBlock(
  editor: LexicalEditor,
  afterKey: string | null,
  create: () => LexicalNode
) {
  let insertedKey = afterKey;
  editor.update(
    () => {
      const block = create();
      const anchor = insertedKey ? $getNodeByKey(insertedKey) : null;
      const top = anchor?.getTopLevelElement() ?? anchor;
      if (top?.getParent()) {
        top.insertAfter(block);
      } else {
        $getRoot().append(block);
      }
      const paragraph = $createParagraphNode();
      block.insertAfter(paragraph);
      paragraph.select();
      insertedKey = paragraph.getKey();
    },
    { discrete: true }
  );
  return insertedKey;
}

export function ImageUploadPlugin() {
  const [editor] = useLexicalComposerContext();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const anchorKeyRef = useRef<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editable, setEditable] = useState(editor.isEditable());

  useEffect(() => editor.registerEditableListener(setEditable), [editor]);

  const rememberSelection = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      anchorKeyRef.current = $isRangeSelection(selection)
        ? selection.anchor.getNode().getKey()
        : null;
    });
  }, [editor]);

  const insertUploaded = (files: File[]) => {
    if (files.length === 0 || !editor.isEditable()) {
      return;
    }
    const anchorKey = anchorKeyRef.current;
    setUploading(true);
    void (async () => {
      let afterKey = anchorKey;
      try {
        for (const file of files) {
          if (isVideoFile(file)) {
            if (file.size > MAX_CONTENT_VIDEO_BYTES) {
              toast.error("Video must be 10MB or smaller");
              continue;
            }
            const uploaded = await uploadContentVideo(file);
            afterKey = placeBlock(editor, afterKey, () =>
              $createContentVideoNode({ src: uploaded.url })
            );
            continue;
          }
          if (file.size > MAX_CONTENT_IMAGE_INPUT_BYTES) {
            toast.error("Image must be 20MB or smaller");
            continue;
          }
          const uploaded = await uploadContentImage(file);
          const altText = altFromFileName(file.name);
          afterKey = placeBlock(editor, afterKey, () =>
            $createContentImageNode({ altText, src: uploaded.url })
          );
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    })();
  };

  const insertRef = useRef(insertUploaded);
  insertRef.current = insertUploaded;

  useEffect(() => {
    const onDragOver = (event: DragEvent) => {
      if (
        [...(event.dataTransfer?.items ?? [])].some(
          (item) => item.kind === "file"
        )
      ) {
        event.preventDefault();
      }
    };
    return editor.registerRootListener((root, previous) => {
      previous?.removeEventListener("dragover", onDragOver);
      root?.addEventListener("dragover", onDragOver);
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      OPEN_CONTENT_IMAGE_UPLOAD_COMMAND,
      () => {
        if (!editor.isEditable()) {
          return false;
        }
        rememberSelection();
        imageInputRef.current?.click();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, rememberSelection]);

  useEffect(() => {
    return editor.registerCommand(
      OPEN_CONTENT_VIDEO_UPLOAD_COMMAND,
      () => {
        if (!editor.isEditable()) {
          return false;
        }
        rememberSelection();
        videoInputRef.current?.click();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, rememberSelection]);

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (!editor.isEditable() || !(event instanceof ClipboardEvent)) {
          return false;
        }
        const files = mediaFiles(event.clipboardData?.files);
        if (files.length === 0) {
          return false;
        }
        event.preventDefault();
        rememberSelection();
        insertRef.current(files);
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, rememberSelection]);

  useEffect(() => {
    return editor.registerCommand(
      DROP_COMMAND,
      (event) => {
        if (!editor.isEditable() || !(event instanceof DragEvent)) {
          return false;
        }
        const files = mediaFiles(event.dataTransfer?.files);
        if (files.length === 0) {
          return false;
        }
        event.preventDefault();
        rememberSelection();
        insertRef.current(files);
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, rememberSelection]);

  if (!editable) {
    return null;
  }

  return (
    <div className="mb-3 flex gap-3">
      <button
        aria-label="Upload image"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm disabled:opacity-60"
        disabled={uploading}
        onMouseDown={(event) => {
          event.preventDefault();
          rememberSelection();
        }}
        onClick={() => imageInputRef.current?.click()}
        type="button"
      >
        <ImagePlus aria-hidden="true" className="size-4" />
        {uploading ? "Uploading…" : "Add image"}
      </button>
      <button
        aria-label="Upload video"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm disabled:opacity-60"
        disabled={uploading}
        onMouseDown={(event) => {
          event.preventDefault();
          rememberSelection();
        }}
        onClick={() => videoInputRef.current?.click()}
        type="button"
      >
        <Film aria-hidden="true" className="size-4" />
        {uploading ? "Uploading…" : "Add video"}
      </button>
      <input
        accept={ACCEPTED_IMAGE_TYPES}
        className="hidden"
        multiple
        onChange={(event) => {
          const files = mediaFiles(event.currentTarget.files);
          event.currentTarget.value = "";
          insertUploaded(files);
        }}
        ref={imageInputRef}
        type="file"
      />
      <input
        accept={Object.keys(CONTENT_VIDEO_MIME_EXTENSIONS).join(",")}
        className="hidden"
        multiple
        onChange={(event) => {
          const files = mediaFiles(event.currentTarget.files);
          event.currentTarget.value = "";
          insertUploaded(files);
        }}
        ref={videoInputRef}
        type="file"
      />
    </div>
  );
}
