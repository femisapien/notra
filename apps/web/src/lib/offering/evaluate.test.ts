import { describe, expect, test } from "bun:test";

import {
  citationShareFor,
  domainLooksLikeBrand,
  offeringIsKnown,
  offeringMatchedTerm,
  offeringSourcesFrom,
} from "./evaluate";
import { buildOfferingPrompt } from "./prompt";

describe("buildOfferingPrompt", () => {
  test("asks about the brand and never names the feature under test", () => {
    const prompt = buildOfferingPrompt("Notra");
    expect(prompt).toContain("Notra");
    expect(prompt.toLowerCase()).not.toContain("agent readiness");
  });
});

describe("offeringIsKnown", () => {
  test("feature mode is true only when the feature appears in the answer", () => {
    expect(
      offeringIsKnown({
        answer: "Notra tracks mentions, citations, and AI traffic.",
        brand: "Notra",
        feature: "Agent readiness",
      })
    ).toBe(false);
    expect(
      offeringIsKnown({
        answer: "Notra includes an agent readiness audit for your site.",
        brand: "Notra",
        feature: "Agent readiness",
      })
    ).toBe(true);
  });

  test("product mode ignores answers that name the brand while saying it was not found", () => {
    expect(
      offeringMatchedTerm({
        answer: "I could not find Notra in current sources.",
        brand: "Notra",
        feature: null,
      })
    ).toBeNull();
    expect(
      offeringIsKnown({
        answer:
          "Notra is a GEO platform that tracks brand mentions in AI answers.",
        brand: "Notra",
        feature: null,
      })
    ).toBe(true);
  });
});

describe("citationShareFor", () => {
  test("ranks domains by citation count and flags the brand site", () => {
    const sources = offeringSourcesFrom([
      { url: "https://www.usenotra.com/features", title: "Features" },
      { url: "https://docs.usenotra.com", title: "Docs" },
      { url: "https://www.profound.com", title: "Profound" },
      { url: "https://usenotra.com/blog", title: "Blog" },
    ]);
    const rows = citationShareFor(sources, "Notra");
    expect(rows[0]?.domain).toBe("usenotra.com");
    expect(rows[0]?.count).toBe(2);
    expect(rows[0]?.share).toBe(50);
    expect(rows[0]?.isBrand).toBe(true);
    expect(rows[1]?.domain).toBe("docs.usenotra.com");
    expect(rows[1]?.isBrand).toBe(true);
    expect(rows.at(-1)?.domain).toBe("profound.com");
    expect(rows.at(-1)?.isBrand).toBe(false);
  });

  test("skips non-http sources", () => {
    expect(
      offeringSourcesFrom([
        { url: "not-a-url", title: "Nope" },
        { url: "https://example.com", title: "Example" },
      ])
    ).toEqual([
      { url: "https://example.com", title: "Example", domain: "example.com" },
    ]);
  });
});

describe("domainLooksLikeBrand", () => {
  test("requires a slug of at least three characters", () => {
    expect(domainLooksLikeBrand("ai.com", "AI")).toBe(false);
    expect(domainLooksLikeBrand("resend.com", "Resend")).toBe(true);
  });
});
