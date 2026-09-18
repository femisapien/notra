import { Effect } from "effect";
import type { NextRequest } from "next/server";

import {
  OFFERING_BRAND_QUERY_KEY,
  OFFERING_FEATURE_QUERY_KEY,
} from "@/constants/offering";
import { buildOfferingMarkdown } from "@/lib/offering/markdown";
import { enforceOfferingRateLimit } from "@/lib/offering/ratelimit";
import {
  OfferingScanFailed,
  OfferingScanUnavailable,
  runOfferingScan,
} from "@/lib/offering/scan";
import {
  normalizeOfferingFeature,
  sanitizeOfferingInput,
} from "@/lib/offering/prompt";
import { offeringScanRequestSchema } from "@/schemas/offering";
import { markdownResponse } from "@/utils/http";

export const runtime = "nodejs";

export const maxDuration = 60;

const INPUT_PREVIEW_LENGTH = 64;

function markdownError(title: string, body: string, status: number) {
  return markdownResponse(`# ${title}\n\n${body}\n`, status);
}

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const rawBrand = params.has(OFFERING_BRAND_QUERY_KEY)
    ? (params.get(OFFERING_BRAND_QUERY_KEY) ?? "")
    : null;
  const parsedInput =
    rawBrand === null
      ? null
      : offeringScanRequestSchema.safeParse({
          brand: rawBrand,
          feature:
            params.get(OFFERING_FEATURE_QUERY_KEY) ?? undefined,
        });
  const brand =
    parsedInput?.success
      ? sanitizeOfferingInput(parsedInput.data.brand)
      : null;
  const feature = parsedInput?.success
    ? normalizeOfferingFeature(parsedInput.data.feature)
    : null;
  const hasInvalidInput = rawBrand !== null && (!brand || brand.length < 2);
  const invalidInput = hasInvalidInput
    ? rawBrand.slice(0, INPUT_PREVIEW_LENGTH)
    : null;

  if (!brand) {
    return markdownResponse(buildOfferingMarkdown(null, invalidInput));
  }

  return Effect.runPromise(
    Effect.gen(function* () {
      yield* enforceOfferingRateLimit(request);
      const result = yield* runOfferingScan({ brand, feature });
      return markdownResponse(buildOfferingMarkdown(result, null));
    }).pipe(
      Effect.match({
        onFailure: (error) => {
          if (error._tag === "OfferingRateLimitUnavailable") {
            return markdownError(
              "Rate limit service unavailable",
              "Try again in a moment.",
              503
            );
          }
          if (error._tag === "OfferingRateLimitExceeded") {
            return markdownError(
              "Rate limit exceeded",
              "Too many scans in a row. Try again later.",
              429
            );
          }
          if (error instanceof OfferingScanUnavailable) {
            return markdownError(
              "Scan unavailable",
              "This scan is not available right now.",
              503
            );
          }
          if (error instanceof OfferingScanFailed && error.timedOut) {
            return markdownError(
              "Scan timed out",
              "The scan took too long. Try again.",
              504
            );
          }
          return markdownError(
            "Scan failed",
            "Something went wrong. Try again.",
            500
          );
        },
        onSuccess: (response) => response,
      })
    )
  );
}
