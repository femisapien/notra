import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { updatePublishedContentInputSchema } from "./assistant-tools";

describe("updatePublishedContentInputSchema", () => {
  test("trims optional text and rejects blank values", () => {
    assert.deepEqual(
      updatePublishedContentInputSchema.parse({
        postId: "post",
        markdown: "# Updated",
        title: "  Updated title  ",
        commitMessage: "  docs: update  ",
      }),
      {
        postId: "post",
        markdown: "# Updated",
        title: "Updated title",
        commitMessage: "docs: update",
      }
    );
    for (const field of ["title", "commitMessage"] as const) {
      assert.equal(
        updatePublishedContentInputSchema.safeParse({
          postId: "post",
          markdown: "# Updated",
          [field]: "   ",
        }).success,
        false
      );
    }
  });
});
