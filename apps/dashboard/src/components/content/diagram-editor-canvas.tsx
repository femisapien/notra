"use client";

import "@excalidraw/excalidraw/index.css";
import { Excalidraw, restoreElements } from "@excalidraw/excalidraw";
import type { ImportedDataState } from "@excalidraw/excalidraw/data/types";
import { useTheme } from "next-themes";

import type { DiagramEditorCanvasProps } from "@/types/components/diagram-editor";

// Loaded only through next/dynamic: Excalidraw is client-only and large.
export default function DiagramEditorCanvas({
  scene,
  onReady,
}: DiagramEditorCanvasProps) {
  const { resolvedTheme } = useTheme();
  // The scene is JSON from our API; restoreElements is Excalidraw's own
  // validator and fills in anything an older scene is missing.
  const elements = restoreElements(
    scene.elements as unknown as ImportedDataState["elements"],
    null,
    { repairBindings: true }
  );

  return (
    <Excalidraw
      excalidrawAPI={onReady}
      initialData={{
        elements,
        appState: {
          viewBackgroundColor: scene.appState?.viewBackgroundColor ?? "#ffffff",
        },
        scrollToContent: true,
      }}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      UIOptions={{
        canvasActions: {
          export: false,
          loadScene: false,
          saveToActiveFile: false,
        },
      }}
    />
  );
}
