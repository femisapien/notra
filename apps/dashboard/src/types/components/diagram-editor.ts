import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

export interface DiagramEditorScene {
  elements: Record<string, unknown>[];
  appState?: { viewBackgroundColor?: string };
}

export interface DiagramEditorCanvasProps {
  scene: DiagramEditorScene;
  onReady: (api: ExcalidrawImperativeAPI) => void;
}

export interface DiagramEditorDialogProps {
  organizationId: string;
  contentId: string;
  onSaved: () => Promise<unknown> | void;
}
