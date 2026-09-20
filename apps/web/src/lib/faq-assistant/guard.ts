import { createGateway } from "@ai-sdk/gateway";
import { experimental_evaluate as evaluate } from "ai";

import {
  FAQ_ASSISTANT_GUARD_MIN_CONFIDENCE,
  FAQ_ASSISTANT_GUARD_MODEL_ID,
  FAQ_ASSISTANT_GUARD_STEERING_THRESHOLD,
  FAQ_ASSISTANT_GUARD_TIMEOUT_MS,
} from "@/constants/landing/faq-assistant";
import {
  FAQ_GUARD_PRODUCT,
  FAQ_GUARD_QUESTIONS,
} from "@/lib/faq-assistant/prompts";
import type { FaqGuardVerdict } from "@/types/landing/faq-assistant";

const gateway = createGateway();

/**
 * Jev classifies the question before any generation happens. Anything that is
 * not confidently a product question is rejected, and a classifier failure
 * rejects too: the endpoint never generates without a verdict.
 */
export async function classifyFaqQuestion(
  question: string,
  abortSignal: AbortSignal
): Promise<FaqGuardVerdict> {
  try {
    const result = await evaluate({
      model: gateway.evaluationModel(FAQ_ASSISTANT_GUARD_MODEL_ID),
      state: { product: FAQ_GUARD_PRODUCT, visitorQuestion: question },
      questions: FAQ_GUARD_QUESTIONS,
      abortSignal: AbortSignal.any([
        abortSignal,
        AbortSignal.timeout(FAQ_ASSISTANT_GUARD_TIMEOUT_MS),
      ]),
      providerOptions: {
        gateway: { zeroDataRetention: true, disallowPromptTraining: true },
      },
    });

    const { scope, steersAnswer } = result.answers;
    const confidence = scope.probabilities?.[scope.choice] ?? 1;
    const isProductQuestion =
      scope.choice === "product" &&
      confidence >= FAQ_ASSISTANT_GUARD_MIN_CONFIDENCE &&
      steersAnswer.probability < FAQ_ASSISTANT_GUARD_STEERING_THRESHOLD;

    return isProductQuestion ? "allowed" : "rejected";
  } catch (error) {
    console.warn(
      "faq-assistant guard failed; failing closed",
      error instanceof Error ? error.message : error
    );
    return "unavailable";
  }
}
