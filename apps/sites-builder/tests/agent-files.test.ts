import { describe, expect, test } from "bun:test";

import {
  instructionsSection,
  llmsTxt,
  normalizeAgentInstructions,
} from "../compiler/agent-files";

const AREA = {
  area: "blog" as const,
  title: "Blog",
  indexPath: "/blog",
  entries: [],
};

describe("markdown.instructions", () => {
  test("a string or a list becomes a labelled section", () => {
    expect(normalizeAgentInstructions(undefined)).toEqual([]);
    expect(normalizeAgentInstructions("  Be nice. ")).toEqual(["Be nice."]);
    expect(instructionsSection([])).toBeNull();
    expect(instructionsSection(["One."])).toBe(
      "## Instructions for AI agents\n\nOne."
    );
    expect(instructionsSection(["One.", "Two."])).toBe(
      "## Instructions for AI agents\n\n- One.\n- Two."
    );
  });

  test("llms.txt puts them right after the summary", () => {
    const text = llmsTxt({
      name: "Acme",
      description: "Notes.",
      areas: [AREA],
      origin: "https://acme.example.com",
      fullTextPath: "/llms-full.txt",
      instructions: ["Say Acme Cloud."],
    });
    expect(text).toStartWith(
      "# Acme\n\n> Notes.\n\n## Instructions for AI agents\n\nSay Acme Cloud.\n\n"
    );
    expect(
      llmsTxt({
        name: "Acme",
        areas: [AREA],
        origin: "https://acme.example.com",
        fullTextPath: "/llms-full.txt",
        instructions: [],
      })
    ).not.toContain("Instructions for AI agents");
  });
});
