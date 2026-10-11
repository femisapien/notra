import { Effect, Schema } from "effect";

import {
  SANDBOX_ERROR_DETAIL_MAX_BYTES,
  SANDBOX_ERROR_DETAIL_MAX_LENGTH,
  SANDBOX_ERROR_DETAIL_TIMEOUT_MS,
} from "../constants/sandbox-error-detail";
import { sandboxErrorDetailSchema } from "../schemas/sandbox-error-detail";
import { redactBuildLog } from "./build-log";
import { readBodyUpToEffect } from "./read-body";

export const sandboxErrorDetailEffect = Effect.fn("Sites.Sandbox.errorDetail")(
  function* (response: Response, apiKey: string) {
    if (
      response.headers
        .get("content-type")
        ?.split(";")[0]
        ?.trim()
        .toLowerCase() !== "application/json" ||
      Number(response.headers.get("content-length")) >
        SANDBOX_ERROR_DETAIL_MAX_BYTES
    ) {
      return "";
    }
    const body = yield* readBodyUpToEffect(
      response,
      SANDBOX_ERROR_DETAIL_MAX_BYTES
    );
    if (body.exceeded) {
      return "";
    }
    const detail = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(sandboxErrorDetailSchema)
    )(new TextDecoder().decode(body.bytes));
    return redactBuildLog(detail.error, [apiKey])
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, SANDBOX_ERROR_DETAIL_MAX_LENGTH);
  },
  (program) =>
    program.pipe(
      Effect.catch(() => Effect.succeed("")),
      Effect.timeoutOrElse({
        duration: SANDBOX_ERROR_DETAIL_TIMEOUT_MS,
        orElse: () => Effect.succeed(""),
      })
    )
);
