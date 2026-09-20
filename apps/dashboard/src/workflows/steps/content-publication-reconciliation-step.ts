import { recordContentPublication } from "@notra/ai/utils/content-publication";

export async function reconcileContentPublicationStep(
  publication: Parameters<typeof recordContentPublication>[0]
) {
  "use step";
  await recordContentPublication(publication);
}

reconcileContentPublicationStep.maxRetries = 11;
