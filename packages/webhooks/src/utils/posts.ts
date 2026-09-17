import type { PostPublishedInput } from "../types/posts";

// Shared by the Effect pipeline and the transactional drizzle adapter so both
// use the same source key and payload shape.
export const postPublishedInput = (input: PostPublishedInput) =>
  ({
    organizationId: input.organizationId,
    sourceKey: `post:${input.postId}:published`,
    event: {
      type: "post.published",
      data: { postId: input.postId },
    },
  }) as const;
