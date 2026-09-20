import { reconcileContentPublicationStep } from "./steps/content-publication-reconciliation-step";

export async function contentPublicationReconciliationWorkflow(
  publication: Parameters<typeof reconcileContentPublicationStep>[0]
) {
  "use workflow";
  await reconcileContentPublicationStep(publication);
}
