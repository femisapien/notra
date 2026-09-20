import { describe, expect, test } from "bun:test";

import {
  buildGitHubMentionSuggestions,
  commentableLinesFromPatch,
  fitGitHubMentionSuggestionsToRange,
  formatGitHubMentionSuggestionBlock,
  formatGitHubMentionSuggestionDiff,
  isGitHubMentionSuggestionCommentable,
} from "@notra/ai/utils/github-mention-suggestion";

const PATH = "docs/getting-started.md";
const PREVIOUS = [
  "# Getting started",
  "",
  "Install the Acme CLI with `npm i -g acme`.",
  "",
  "## See also",
  "",
  "- [Release 2.4 changelog](/changelog/release-2-4)",
  "",
  "## Support",
  "",
  "Write to us.",
  "",
].join("\n");

function applySuggestions(
  previous: string,
  suggestions: ReturnType<typeof buildGitHubMentionSuggestions>
) {
  const lines = previous.split("\n");
  for (const suggestion of [...suggestions].reverse()) {
    lines.splice(
      suggestion.startLine - 1,
      suggestion.line - suggestion.startLine + 1,
      ...suggestion.replacement
    );
  }
  return lines.join("\n");
}

describe("buildGitHubMentionSuggestions", () => {
  test("replaces a reworked region with one suggestion", () => {
    const next = PREVIOUS.replace(
      "## See also\n\n- [Release 2.4 changelog](/changelog/release-2-4)",
      "See the [Release 2.4 changelog](/changelog/release-2-4) for what's new."
    );
    const suggestions = buildGitHubMentionSuggestions({
      path: PATH,
      previous: PREVIOUS,
      next,
    });
    expect(suggestions).toEqual([
      {
        path: PATH,
        startLine: 5,
        line: 7,
        previousLines: [
          "## See also",
          "",
          "- [Release 2.4 changelog](/changelog/release-2-4)",
        ],
        replacement: [
          "See the [Release 2.4 changelog](/changelog/release-2-4) for what's new.",
        ],
      },
    ]);
    expect(applySuggestions(PREVIOUS, suggestions)).toBe(next);
  });

  test("keeps distant edits as separate suggestions", () => {
    const next = PREVIOUS.replace("# Getting started", "# Start here").replace(
      "Write to us.",
      "Write to support@acme.dev."
    );
    const suggestions = buildGitHubMentionSuggestions({
      path: PATH,
      previous: PREVIOUS,
      next,
    });
    expect(suggestions.map(({ startLine, line }) => [startLine, line])).toEqual(
      [
        [1, 1],
        [11, 11],
      ]
    );
    expect(applySuggestions(PREVIOUS, suggestions)).toBe(next);
  });

  test("anchors an insertion on the line before it", () => {
    const next = PREVIOUS.replace(
      "Write to us.\n",
      "Write to us.\n\nWe answer within a day.\n"
    );
    const suggestions = buildGitHubMentionSuggestions({
      path: PATH,
      previous: PREVIOUS,
      next,
    });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      startLine: 11,
      line: 11,
      replacement: ["Write to us.", "", "We answer within a day."],
    });
    expect(applySuggestions(PREVIOUS, suggestions)).toBe(next);
  });

  test("anchors an insertion at the top on the first line", () => {
    const next = `Draft, do not share.\n${PREVIOUS}`;
    const suggestions = buildGitHubMentionSuggestions({
      path: PATH,
      previous: PREVIOUS,
      next,
    });
    expect(suggestions[0]).toMatchObject({
      startLine: 1,
      line: 1,
      replacement: ["Draft, do not share.", "# Getting started"],
    });
    expect(applySuggestions(PREVIOUS, suggestions)).toBe(next);
  });

  test("turns a removed block into an empty replacement", () => {
    const next = PREVIOUS.replace("\n\n## Support\n\nWrite to us.", "");
    const suggestions = buildGitHubMentionSuggestions({
      path: PATH,
      previous: PREVIOUS,
      next,
    });
    expect(applySuggestions(PREVIOUS, suggestions)).toBe(next);
  });

  test("ignores a missing final newline", () => {
    expect(
      buildGitHubMentionSuggestions({
        path: PATH,
        previous: PREVIOUS,
        next: PREVIOUS.trimEnd(),
      })
    ).toEqual([]);
  });

  test("preserves trailing blank lines beyond the final newline", () => {
    const suggestions = buildGitHubMentionSuggestions({
      path: PATH,
      previous: "hello\n\n\n",
      next: "hello\n",
    });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.previousLines).toEqual(["", ""]);
    expect(suggestions[0]?.replacement).toEqual([]);
  });
});

describe("fitGitHubMentionSuggestionsToRange", () => {
  test("widens the change to the lines of the review thread", () => {
    const next = PREVIOUS.replace("## See also", "## Related");
    const suggestions = buildGitHubMentionSuggestions({
      path: PATH,
      previous: PREVIOUS,
      next,
    });
    const fitted = fitGitHubMentionSuggestionsToRange({
      suggestions,
      previous: PREVIOUS,
      range: { startLine: 5, line: 7 },
    });
    expect(fitted?.replacement).toEqual([
      "## Related",
      "",
      "- [Release 2.4 changelog](/changelog/release-2-4)",
    ]);
  });

  test("gives up when a change falls outside the thread", () => {
    const suggestions = buildGitHubMentionSuggestions({
      path: PATH,
      previous: PREVIOUS,
      next: PREVIOUS.replace("Write to us.", "Write to support."),
    });
    expect(
      fitGitHubMentionSuggestionsToRange({
        suggestions,
        previous: PREVIOUS,
        range: { startLine: 5, line: 7 },
      })
    ).toBeNull();
  });
});

describe("commentable lines", () => {
  const patch = [
    "@@ -1,3 +1,4 @@",
    " # Getting started",
    " ",
    "-Install the CLI.",
    "+Install the Acme CLI.",
    "+",
    "@@ -20,2 +21,2 @@",
    " ## Support",
    "-Write.",
    "+Write to us.",
    "\\ No newline at end of file",
  ].join("\n");

  test("covers added and context lines of every hunk", () => {
    expect([...commentableLinesFromPatch(patch)]).toEqual([1, 2, 3, 4, 21, 22]);
    expect(commentableLinesFromPatch(null).size).toBe(0);
  });

  test("needs the whole range inside the diff", () => {
    const commentable = commentableLinesFromPatch(patch);
    expect(
      isGitHubMentionSuggestionCommentable(
        { startLine: 3, line: 4 },
        commentable
      )
    ).toBe(true);
    expect(
      isGitHubMentionSuggestionCommentable(
        { startLine: 4, line: 5 },
        commentable
      )
    ).toBe(false);
  });
});

describe("suggestion formatting", () => {
  test("widens the fence around code samples", () => {
    expect(formatGitHubMentionSuggestionBlock(["Plain line."])).toBe(
      "```suggestion\nPlain line.\n```"
    );
    expect(
      formatGitHubMentionSuggestionBlock(["```bash", "acme login", "```"])
    ).toBe("````suggestion\n```bash\nacme login\n```\n````");
  });

  test("falls back to a plain diff", () => {
    expect(
      formatGitHubMentionSuggestionDiff({
        path: PATH,
        startLine: 1,
        line: 1,
        previousLines: ["# Getting started"],
        replacement: ["# Start here"],
      })
    ).toBe("```diff\n-# Getting started\n+# Start here\n```");
  });
});
