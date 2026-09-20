import { createHash } from "node:crypto";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Data, Effect } from "effect";
import type { NextRequest } from "next/server";

import { FAQ_ASSISTANT_RATE_LIMITS } from "@/constants/landing/faq-assistant";

type LimiterKind = keyof typeof FAQ_ASSISTANT_RATE_LIMITS;

class FaqAssistantRateLimitExceeded extends Data.TaggedError(
  "FaqAssistantRateLimitExceeded"
)<{ readonly reset: number }> {}

const limiters: Partial<Record<LimiterKind, Ratelimit | null>> = {};

function getLimiter(kind: LimiterKind): Ratelimit | null {
  if (limiters[kind] !== undefined) {
    return limiters[kind] ?? null;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!(url && token)) {
    limiters[kind] = null;
    return null;
  }

  const config = FAQ_ASSISTANT_RATE_LIMITS[kind];

  limiters[kind] = new Ratelimit({
    redis: new Redis({ url, token }),
    analytics: true,
    prefix: `ratelimit:web:faq-assistant-${kind}`,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
  });
  return limiters[kind] ?? null;
}

function getClientIp(request: NextRequest): string {
  // On Vercel only the platform-set x-vercel-forwarded-for is trustworthy.
  if (process.env.VERCEL) {
    return (
      request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown"
    );
  }

  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function getIpRateLimitKey(request: NextRequest): string {
  return createHash("sha256").update(getClientIp(request)).digest("hex");
}

const enforceLimit = Effect.fn("enforceFaqAssistantLimit")(function* (
  kind: LimiterKind,
  key: string
) {
  const limiter = getLimiter(kind);

  if (!limiter) {
    // Fail closed on any deployed environment: an unmetered public LLM
    // endpoint is worse than a missing one. Only local dev passes through.
    const isDeployed =
      process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
    if (isDeployed) {
      console.warn(
        `faq-assistant rate limiter unavailable for "${kind}"; failing closed`
      );
      return yield* Effect.fail(
        new FaqAssistantRateLimitExceeded({ reset: 0 })
      );
    }
    return;
  }

  // Redis errors and timeouts also fail closed.
  const result = yield* Effect.tryPromise({
    try: () => limiter.limit(key),
    catch: () => new FaqAssistantRateLimitExceeded({ reset: 0 }),
  });

  if (!result.success || result.reason === "timeout") {
    return yield* Effect.fail(
      new FaqAssistantRateLimitExceeded({ reset: result.reset })
    );
  }
});

// Per-IP limits run first so one noisy client cannot drain the global budget.
export const enforceFaqAssistantRateLimit = Effect.fn(
  "enforceFaqAssistantRateLimit"
)(function* (request: NextRequest) {
  const ipKey = getIpRateLimitKey(request);
  yield* enforceLimit("ipMinute", ipKey);
  yield* enforceLimit("ipDaily", ipKey);
  yield* enforceLimit("globalHourly", "global");
  yield* enforceLimit("globalDaily", "global");
});
