export function sanitizeOfferingInput(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeOfferingFeature(
  feature: string | undefined
): string | null {
  const value = sanitizeOfferingInput(feature ?? "");
  return value.length === 0 ? null : value;
}

/**
 * Buyer-style prompt about the product only. The feature under test is never
 * included, so a yes/no cannot come from echoing the question.
 */
export function buildOfferingPrompt(brand: string): string {
  return `what does ${brand} offer, which products and features do they actually have`;
}

export const OFFERING_SYSTEM_PROMPT =
  "You are a helpful AI assistant with web search. Answer the buyer's question directly from current public sources. Name only products and features you actually found. If you cannot find the company, say you could not find it. Do not invent offerings. Do not use em dashes.";
