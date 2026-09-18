// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";

const OFFERING_TEXT_MAX = 80;

const offeringText = z
  .string()
  .trim()
  .max(OFFERING_TEXT_MAX, "Keep that under 80 characters.");

export const offeringScanRequestSchema = z.object({
  brand: offeringText.min(2, "Enter a product or brand."),
  feature: offeringText.optional(),
});

const offeringSourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  domain: z.string(),
});

const offeringCitationShareSchema = z.object({
  domain: z.string(),
  count: z.number(),
  share: z.number(),
  title: z.string(),
  url: z.string(),
  isBrand: z.boolean(),
});

export const offeringScanResultSchema = z.object({
  brand: z.string(),
  feature: z.string().nullable(),
  prompt: z.string(),
  known: z.boolean(),
  matchedTerm: z.string().nullable(),
  answer: z.string(),
  engine: z.string(),
  queries: z.array(z.string()),
  sources: z.array(offeringSourceSchema),
  citations: z.array(offeringCitationShareSchema),
  cached: z.boolean(),
});
