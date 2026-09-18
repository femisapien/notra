import { createHash } from "node:crypto";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Data, Effect } from "effect";
import type { NextRequest } from "next/server";

import { OFFERING_RATE_LIMIT } from "@/constants/offering";

class OfferingRateLimitExceeded extends Data.TaggedError(
  "OfferingRateLimitExceeded"
)<{
  readonly reset: number;
}> {}

class OfferingRateLimitUnavailable extends Data.TaggedError(
  "OfferingRateLimitUnavailable"
)<{
  readonly cause: unknown;
}> {}

let limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit | null {
  if (limiter) {
    return limiter;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!(url && token)) {
    return null;
  }
  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    prefix: "ratelimit:web:offering",
    limiter: Ratelimit.slidingWindow(
      OFFERING_RATE_LIMIT.requests,
      OFFERING_RATE_LIMIT.window
    ),
  });
  return limiter;
}

function getClientIp(request: NextRequest): string {
  const vercelForwardedFor = request.headers
    .get("x-vercel-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  if (vercelForwardedFor) {
    return vercelForwardedFor;
  }
  if (process.env.VERCEL) {
    return "unknown";
  }
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export const enforceOfferingRateLimit = Effect.fn("enforceOfferingRateLimit")(
  function* (request: NextRequest) {
    const ratelimit = getLimiter();
    if (!ratelimit) {
      if (process.env.NODE_ENV === "production") {
        return yield* Effect.fail(
          new OfferingRateLimitUnavailable({
            cause: new Error(
              "UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set"
            ),
          })
        );
      }
      return;
    }
    const key = createHash("sha256").update(getClientIp(request)).digest("hex");
    const result = yield* Effect.tryPromise({
      try: () => ratelimit.limit(key),
      catch: (cause) => new OfferingRateLimitUnavailable({ cause }),
    });
    if (!result.success) {
      return yield* Effect.fail(
        new OfferingRateLimitExceeded({ reset: result.reset })
      );
    }
  }
);
