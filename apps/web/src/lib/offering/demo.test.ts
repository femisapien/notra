import { describe, expect, test } from "bun:test";

import { buildDemoOfferingScan } from "./demo";
import { buildOfferingPrompt } from "./prompt";

describe("buildDemoOfferingScan", () => {
  test("Notra agent readiness is a hit and the prompt still omits the feature", () => {
    const result = buildDemoOfferingScan({
      brand: "Notra",
      feature: "Agent readiness",
    });
    expect(result.known).toBe(true);
    expect(result.matchedTerm).toBe("Agent readiness");
    expect(result.prompt).toBe(buildOfferingPrompt("Notra"));
    expect(result.prompt.toLowerCase()).not.toContain("agent readiness");
    expect(result.citations[0]?.domain).toBe("usenotra.com");
    expect(result.citations[0]?.isBrand).toBe(true);
  });

  test("Linear customer requests is a miss with citations of what it found instead", () => {
    const result = buildDemoOfferingScan({
      brand: "Linear",
      feature: "Customer requests",
    });
    expect(result.known).toBe(false);
    expect(result.answer.toLowerCase()).not.toContain("customer requests");
    expect(result.citations.length).toBeGreaterThan(0);
  });
});
