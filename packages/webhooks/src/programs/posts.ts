import { Effect } from "effect";

import { publishEvent } from "./events";

// Shared by the Effect pipeline and the transactional drizzle adapter so both
// use the same source key and payload shape.
export const postPublishedInput = (input: {
  organizationId: string;
  postId: string;
}) =>
  ({
    organizationId: input.organizationId,
    sourceKey: `post:${input.postId}:published`,
    event: {
      type: "post.published",
      data: { postId: input.postId },
    },
  }) as const;

// First publish wins: unpublishing and republishing a post does not emit
// another event, mirroring the terminal-generation dedupe semantics.
export const publishPostPublished = Effect.fn("webhooks.publishPostPublished")(
  function* (input: { organizationId: string; postId: string }) {
    return yield* publishEvent(postPublishedInput(input));
  }
);
