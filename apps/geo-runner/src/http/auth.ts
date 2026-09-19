import { timingSafeEqual } from "node:crypto";

import { Config, Effect, Redacted } from "effect";
import { HttpServerRequest } from "effect/unstable/http";

const BEARER_PREFIX = "Bearer ";

function matches(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * True when the request carries the shared runner secret. An unset secret
 * authorizes nothing, so a misconfigured deploy fails closed.
 */
export const isAuthorized = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const secret = yield* Config.redacted("GEO_RUNNER_SECRET").pipe(
    Config.withDefault(Redacted.make("")),
    Effect.map((value) => Redacted.value(value).trim()),
    Effect.orElseSucceed(() => "")
  );
  const header = request.headers.authorization ?? "";
  if (secret.length === 0 || !header.startsWith(BEARER_PREFIX)) {
    return false;
  }
  return matches(header.slice(BEARER_PREFIX.length).trim(), secret);
});
