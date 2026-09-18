import { createGateway } from "@ai-sdk/gateway";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { generateText, isStepCount } from "ai";
import { Data, Effect } from "effect";

import {
  OFFERING_DEMO_DELAY,
  OFFERING_DIRECT_MODEL_ID,
  OFFERING_ENGINE_ID,
  OFFERING_ENGINE_LABEL,
  OFFERING_MAX_OUTPUT_TOKENS,
  OFFERING_MAX_STEPS,
  OFFERING_SCAN_TIMEOUT_MS,
} from "@/constants/offering";
import {
  offeringCacheKey,
  readOfferingScanCache,
  writeOfferingScanCache,
} from "@/lib/offering/cache";
import { buildDemoOfferingScan, isOfferingDemoMode } from "@/lib/offering/demo";
import {
  citationShareFor,
  offeringMatchedTerm,
  offeringSourcesFrom,
} from "@/lib/offering/evaluate";
import {
  buildOfferingPrompt,
  OFFERING_SYSTEM_PROMPT,
} from "@/lib/offering/prompt";
import type { OfferingScanResult } from "@/types/offering";

export class OfferingScanUnavailable extends Data.TaggedError(
  "OfferingScanUnavailable"
)<{
  readonly message: string;
}> {}

export class OfferingScanFailed extends Data.TaggedError("OfferingScanFailed")<{
  readonly message: string;
  readonly timedOut?: boolean;
  readonly cause?: unknown;
}> {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectQueries(toolCalls: readonly unknown[] | undefined): string[] {
  const queries: string[] = [];
  const seen = new Set<string>();
  for (const call of toolCalls ?? []) {
    if (!isRecord(call) || !isRecord(call.input)) {
      continue;
    }
    const query = call.input.query ?? call.input.q ?? call.input.search_query;
    if (typeof query !== "string") {
      continue;
    }
    const trimmed = query.trim();
    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    queries.push(trimmed);
  }
  return queries;
}

function createInvocation() {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY?.trim();
  const hasVercelOidc =
    Boolean(process.env.VERCEL_OIDC_TOKEN) || process.env.VERCEL === "1";
  if (gatewayKey || hasVercelOidc) {
    const gateway = createGateway({
      apiKey: gatewayKey || undefined,
      headers: {
        "http-referer": "https://www.usenotra.com",
        "x-title": "Notra",
      },
    });
    return {
      model: gateway(OFFERING_ENGINE_ID),
      tools: { web_search: openai.tools.webSearch({}) },
    };
  }
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    const provider = createOpenAI({ apiKey: openaiKey });
    return {
      model: provider.responses(OFFERING_DIRECT_MODEL_ID),
      tools: { web_search: provider.tools.webSearch({}) },
    };
  }
  return null;
}

async function generateOfferingAnswer(prompt: string, signal: AbortSignal) {
  const invocation = createInvocation();
  if (!invocation) {
    throw new OfferingScanUnavailable({
      message: "AI_GATEWAY_API_KEY or OPENAI_API_KEY is not set",
    });
  }
  return generateText({
    model: invocation.model,
    tools: invocation.tools,
    stopWhen: isStepCount(OFFERING_MAX_STEPS),
    prompt,
    instructions: OFFERING_SYSTEM_PROMPT,
    maxOutputTokens: OFFERING_MAX_OUTPUT_TOKENS,
    abortSignal: signal,
  });
}

export const runOfferingScan = Effect.fn("runOfferingScan")(function* (input: {
  brand: string;
  feature: string | null;
}) {
  const cacheKey = offeringCacheKey(input.brand, input.feature);
  const cached = yield* Effect.promise(() => readOfferingScanCache(cacheKey));
  if (cached) {
    return cached;
  }

  if (!createInvocation() && isOfferingDemoMode()) {
    yield* Effect.sleep(OFFERING_DEMO_DELAY);
    return buildDemoOfferingScan(input);
  }

  const prompt = buildOfferingPrompt(input.brand);
  const result = yield* Effect.tryPromise({
    try: (signal) => generateOfferingAnswer(prompt, signal),
    catch: (cause) => {
      if (cause instanceof OfferingScanUnavailable) {
        return cause;
      }
      return new OfferingScanFailed({
        message: "GPT-5.6 failed to answer",
        cause,
      });
    },
  }).pipe(
    Effect.timeoutOrElse({
      duration: OFFERING_SCAN_TIMEOUT_MS,
      orElse: () =>
        Effect.fail(
          new OfferingScanFailed({
            message: `Scan timed out after ${OFFERING_SCAN_TIMEOUT_MS}ms`,
            timedOut: true,
          })
        ),
    })
  );

  const sdkSources = result.sources.flatMap((source) =>
    source.sourceType === "url"
      ? [{ url: source.url, title: source.title }]
      : []
  );
  const sources = offeringSourcesFrom(sdkSources);
  const queries = [
    ...new Set(result.steps.flatMap((step) => collectQueries(step.toolCalls))),
  ];
  const matchedTerm = offeringMatchedTerm({
    answer: result.text,
    brand: input.brand,
    feature: input.feature,
  });
  const scanResult: OfferingScanResult = {
    brand: input.brand,
    feature: input.feature,
    prompt,
    known: matchedTerm !== null,
    matchedTerm,
    answer: result.text.trim(),
    engine: OFFERING_ENGINE_LABEL,
    queries,
    sources,
    citations: citationShareFor(sources, input.brand),
    cached: false,
  };

  yield* Effect.promise(() => writeOfferingScanCache(cacheKey, scanResult));

  return scanResult;
});
