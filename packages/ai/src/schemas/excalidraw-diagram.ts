// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

const colorSchema = z.string().trim().min(1).max(40);

const labelSchema = z
  .union([
    z.string(),
    z.object({
      text: z.string(),
      fontSize: z.number().positive().max(96).optional(),
      strokeColor: colorSchema.optional(),
    }),
  ])
  .transform((value) => (typeof value === "string" ? { text: value } : value));

const sharedStyleFields = {
  id: z.string().trim().min(1).max(80).optional(),
  strokeColor: colorSchema.optional(),
  backgroundColor: colorSchema.optional(),
  fillStyle: z.enum(["solid", "hachure", "cross-hatch", "zigzag"]).optional(),
  strokeWidth: z.number().positive().max(8).optional(),
  strokeStyle: z.enum(["solid", "dashed", "dotted"]).optional(),
  roughness: z.number().min(0).max(2).optional(),
  opacity: z.number().min(0).max(100).optional(),
};

// Radians, clockwise, around the element's center (Excalidraw's convention).
const angleSchema = z.number().min(-7).max(7).optional();

const shapeSchema = z.object({
  ...sharedStyleFields,
  type: z.enum(["rectangle", "ellipse", "diamond"]),
  x: z.number(),
  y: z.number(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  rounded: z.boolean().optional(),
  angle: angleSchema,
  label: labelSchema.optional(),
});

const textSchema = z.object({
  ...sharedStyleFields,
  type: z.literal("text"),
  x: z.number(),
  y: z.number(),
  text: z.string().min(1),
  fontSize: z.number().positive().max(120).optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  angle: angleSchema,
});

const endpointSchema = z.union([
  z.object({
    id: z.string().trim().min(1),
    // Where the arrow meets the shape, as a fraction of its unrotated box
    // ([0, 0] top-left, [1, 1] bottom-right). Omit to snap to the edge.
    anchor: z
      .tuple([z.number().min(-1).max(2), z.number().min(-1).max(2)])
      .optional(),
    // Excalidraw's binding focus for an anchored end, so the editor keeps the
    // attachment when the shape moves.
    focus: z.number().min(-1).max(1).optional(),
  }),
  z.object({ x: z.number(), y: z.number() }),
]);

const arrowheadSchema = z
  .enum(["arrow", "triangle", "dot", "bar", "none"])
  .nullable()
  .optional();

const linearSchema = z.object({
  ...sharedStyleFields,
  type: z.enum(["arrow", "line"]),
  start: endpointSchema,
  end: endpointSchema,
  via: z
    .array(z.tuple([z.number(), z.number()]))
    .max(12)
    .optional(),
  label: labelSchema.optional(),
  // Set when the user curved the arrow in the editor; Notra draws sharp elbows.
  curved: z.boolean().optional(),
  startArrowhead: arrowheadSchema,
  endArrowhead: arrowheadSchema,
});

export const diagramElementSchema = z.discriminatedUnion("type", [
  shapeSchema,
  textSchema,
  linearSchema,
]);

export const diagramSpecSchema = z.object({
  title: z.string().optional(),
  background: colorSchema.optional(),
  elements: z.array(diagramElementSchema).min(1).max(150),
});

export const diagramReviewSchema = z.object({
  needsRevision: z.boolean(),
  reason: z.string().min(1),
  revisionPrompt: z.string().nullable(),
});
