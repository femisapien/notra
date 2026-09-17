import { Effect } from "effect";

import type { PostPublishedInput } from "../types/posts";
import { postPublishedInput } from "../utils/posts";
import { publishEvent } from "./events";

// First publish wins: unpublishing and republishing a post does not emit
// another event, mirroring the terminal-generation dedupe semantics.
export const publishPostPublished = Effect.fn("webhooks.publishPostPublished")(
  function* (input: PostPublishedInput) {
    return yield* publishEvent(postPublishedInput(input));
  }
);
