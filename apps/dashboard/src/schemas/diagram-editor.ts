import { z } from "zod";

const MAX_DIAGRAM_ELEMENTS = 400;

// The server converts the scene back into a validated spec, so this only
// bounds the payload; element shapes are checked by sceneToDiagramSpec.
export const saveDiagramSceneSchema = z.object({
  scene: z.object({
    elements: z
      .array(z.record(z.string(), z.unknown()))
      .min(1)
      .max(MAX_DIAGRAM_ELEMENTS),
    appState: z
      .object({ viewBackgroundColor: z.string().max(40).optional() })
      .optional(),
  }),
});
