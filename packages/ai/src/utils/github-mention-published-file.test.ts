import { describe, expect, test } from "bun:test";

import {
  carryOverImageTargets,
  resolveEditableMarkdown,
} from "./github-mention-published-file";

const POST = "# Release\n\n![Chart](https://cdn.notra.dev/a.png)\n\nOld intro.";
const FILE = "# Release\n\n![Chart](../images/release/a.png)\n\nOld intro.";

describe("carryOverImageTargets", () => {
  test("keeps the repository paths when post text is committed", () => {
    expect(
      carryOverImageTargets(
        POST.replace("Old intro.", "New intro."),
        POST,
        FILE
      )
    ).toBe(FILE.replace("Old intro.", "New intro."));
  });

  test("maps reordered images by source identity, not position", () => {
    const source = "![A](https://cdn/a.png)\n![B](https://cdn/b.png)";
    const repository = "![A](./a.png)\n![B](./b.png)";
    expect(
      carryOverImageTargets(
        "![B](https://cdn/b.png)\n![A](https://cdn/a.png)",
        source,
        repository
      )
    ).toBe("![B](./b.png)\n![A](./a.png)");
  });

  test("does not undo an image replacement", () => {
    expect(
      carryOverImageTargets(
        POST.replace("a.png", "replacement.png"),
        POST,
        FILE
      )
    ).toBe(POST.replace("a.png", "replacement.png"));
  });

  test("leaves repository markdown and unknown mappings alone", () => {
    expect(carryOverImageTargets(FILE, POST, FILE)).toBe(FILE);
    expect(carryOverImageTargets(POST, POST, "No images here.")).toBe(POST);
    expect(carryOverImageTargets("No images here.", POST, FILE)).toBe(
      "No images here."
    );
  });

  test("does not swap one absolute URL for another", () => {
    const edited = POST.replace("a.png", "b.png");
    expect(carryOverImageTargets(edited, POST, POST)).toBe(edited);
  });
});

describe("resolveEditableMarkdown", () => {
  test("uses the post while the pull request head is the recorded one", () => {
    expect(
      resolveEditableMarkdown({
        postMarkdown: POST,
        publishedFile: FILE.replace("Old", "Hand-edited"),
        recordedHeadSha: "aaa",
        pullRequestHeadSha: "aaa",
      })
    ).toEqual({ markdown: POST, fromPullRequest: false });
  });

  test("uses the file once the head moved, retaining repository image paths", () => {
    expect(
      resolveEditableMarkdown({
        postMarkdown: POST,
        publishedFile: FILE.replace("Old", "Hand-edited"),
        recordedHeadSha: "aaa",
        pullRequestHeadSha: "bbb",
      })
    ).toEqual({
      markdown: FILE.replace("Old", "Hand-edited"),
      fromPullRequest: true,
    });
  });

  test("a moved head with repository image paths is a divergence", () => {
    expect(
      resolveEditableMarkdown({
        postMarkdown: POST,
        publishedFile: FILE,
        recordedHeadSha: "aaa",
        pullRequestHeadSha: "bbb",
      })
    ).toEqual({ markdown: FILE, fromPullRequest: true });
  });

  test("falls back to the post when the file could not be read", () => {
    expect(
      resolveEditableMarkdown({
        postMarkdown: POST,
        publishedFile: null,
        recordedHeadSha: "aaa",
        pullRequestHeadSha: "bbb",
      })
    ).toEqual({ markdown: POST, fromPullRequest: false });
  });
});
