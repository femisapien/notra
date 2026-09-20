import { createGateway } from "@ai-sdk/gateway";
import { streamText } from "ai";
import { Effect } from "effect";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  FAQ_ASSISTANT_ANSWER_TIMEOUT_MS,
  FAQ_ASSISTANT_MAX_OUTPUT_TOKENS,
  FAQ_ASSISTANT_MODEL_ID,
} from "@/constants/landing/faq-assistant";
import { classifyFaqQuestion } from "@/lib/faq-assistant/guard";
import {
  buildFaqAssistantPrompt,
  getFaqAssistantSystemPrompt,
} from "@/lib/faq-assistant/prompts";
import { enforceFaqAssistantRateLimit } from "@/lib/faq-assistant/ratelimit";
import { isSameOriginRequest } from "@/lib/faq-assistant/same-origin";
import { faqAssistantRequestSchema } from "@/schemas/faq-assistant";
import { jsonError } from "@/utils/api-response";

export const runtime = "nodejs";
export const maxDuration = 30;

const DISABLED_VALUES = new Set(["0", "false", "off"]);
const gateway = createGateway();

function isDisabled(): boolean {
  const raw = process.env.NOTRA_FAQ_ASSISTANT?.trim().toLowerCase();
  return Boolean(raw && DISABLED_VALUES.has(raw));
}

export async function POST(request: NextRequest) {
  if (isDisabled()) {
    return jsonError("unavailable", 503);
  }

  if (!isSameOriginRequest(request)) {
    return jsonError("forbidden", 403);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("invalid", 400);
  }

  const parsed = faqAssistantRequestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("invalid", 400);
  }

  const { question } = parsed.data;

  const limited = await Effect.runPromise(
    enforceFaqAssistantRateLimit(request).pipe(
      Effect.match({
        onFailure: (error) => error,
        onSuccess: () => null,
      })
    )
  );

  if (limited) {
    const retryAfter = Math.max(
      1,
      Math.ceil((limited.reset - Date.now()) / 1000)
    );
    return NextResponse.json(
      { error: "rate_limited" },
      { headers: { "Retry-After": String(retryAfter) }, status: 429 }
    );
  }

  const verdict = await classifyFaqQuestion(question, request.signal);

  if (verdict === "unavailable") {
    return jsonError("unavailable", 503);
  }

  if (verdict === "rejected") {
    return jsonError("off_topic", 422);
  }

  const result = streamText({
    model: gateway(FAQ_ASSISTANT_MODEL_ID),
    instructions: getFaqAssistantSystemPrompt(),
    prompt: buildFaqAssistantPrompt(question),
    maxOutputTokens: FAQ_ASSISTANT_MAX_OUTPUT_TOKENS,
    temperature: 0.2,
    maxRetries: 1,
    abortSignal: AbortSignal.any([
      request.signal,
      AbortSignal.timeout(FAQ_ASSISTANT_ANSWER_TIMEOUT_MS),
    ]),
    providerOptions: {
      gateway: { disallowPromptTraining: true },
    },
    onError: ({ error }) => {
      console.error("faq-assistant generation failed", error);
    },
  });

  return result.toTextStreamResponse({
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
