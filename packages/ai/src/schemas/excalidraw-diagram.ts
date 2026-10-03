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

const shapeSchema = z.object({
  ...sharedStyleFields,
  type: z.enum(["rectangle", "ellipse", "diamond"]),
  x: z.number(),
  y: z.number(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  rounded: z.boolean().optional(),
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
});

const endpointSchema = z.union([
  z.object({ id: z.string().trim().min(1) }),
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
