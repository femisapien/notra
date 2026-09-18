import { Effect } from "effect";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  OFFERING_BRAND_QUERY_KEY,
  OFFERING_FEATURE_QUERY_KEY,
} from "@/constants/offering";
import {
  normalizeOfferingFeature,
  sanitizeOfferingInput,
} from "@/lib/offering/prompt";
import { enforceOfferingRateLimit } from "@/lib/offering/ratelimit";
import {
  OfferingScanFailed,
  OfferingScanUnavailable,
  runOfferingScan,
} from "@/lib/offering/scan";
import { offeringScanRequestSchema } from "@/schemas/offering";
import { jsonError } from "@/utils/api-response";

export const runtime = "nodejs";

export const maxDuration = 60;

export function GET(request: NextRequest) {
  return respond(request, {
    brand: request.nextUrl.searchParams.get(OFFERING_BRAND_QUERY_KEY) ?? "",
    feature:
      request.nextUrl.searchParams.get(OFFERING_FEATURE_QUERY_KEY) ?? undefined,
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON payload", 400);
  }

  return respond(request, body);
}

function respond(request: NextRequest, body: unknown) {
  const parsed = offeringScanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Enter a product or brand", 400);
  }

  const brand = sanitizeOfferingInput(parsed.data.brand);
  const feature = normalizeOfferingFeature(parsed.data.feature);
  if (brand.length < 2) {
    return jsonError("Enter a product or brand", 422);
  }

  return Effect.runPromise(
    Effect.gen(function* () {
      yield* enforceOfferingRateLimit(request);
      return NextResponse.json(yield* runOfferingScan({ brand, feature }));
    }).pipe(
      Effect.match({
        onFailure: (error) => {
          if (error._tag === "OfferingRateLimitUnavailable") {
            return jsonError("Rate limit service unavailable", 503);
          }
          if (error._tag === "OfferingRateLimitExceeded") {
            const retryAfter = Math.max(
              0,
              Math.ceil((error.reset - Date.now()) / 1000)
            );
            return NextResponse.json(
              { error: "Rate limit exceeded" },
              { headers: { "Retry-After": String(retryAfter) }, status: 429 }
            );
          }
          if (error instanceof OfferingScanUnavailable) {
            return jsonError("This scan is not available right now", 503);
          }
          if (error instanceof OfferingScanFailed && error.timedOut) {
            return jsonError("The scan timed out. Try again.", 504);
          }
          return jsonError("Something went wrong", 500);
        },
        onSuccess: (response) => response,
      })
    )
  );
}
