import { describe, expect, test } from "bun:test";

import { isDemoMode } from "@notra/utils/demo-mode";

import { resolveDemoLanding, safeDemoReturnTo } from "@/utils/demo-return-to";

describe("demo mode switch", () => {
  test("needs the flag and no WorkOS key", () => {
    expect(isDemoMode("1", "")).toBe(true);
    expect(isDemoMode("true", "")).toBe(true);
    expect(isDemoMode("1", "sk_live_123")).toBe(false);
    expect(isDemoMode(undefined, "")).toBe(false);
    expect(isDemoMode("0", "")).toBe(false);
  });
});

describe("demo landing", () => {
  test("rejects open redirects", () => {
    expect(safeDemoReturnTo("//evil.example")).toBeNull();
    expect(safeDemoReturnTo("https://evil.example")).toBeNull();
    expect(safeDemoReturnTo("/\\evil.example")).toBeNull();
    expect(safeDemoReturnTo("/\t/evil.example")).toBeNull();
    expect(safeDemoReturnTo("/geo")).toBe("/geo");
  });

  test("swaps a shared workspace slug for the visitor's own", () => {
    expect(
      resolveDemoLanding("/fieldnote-ab12cd34/geo/prompts", "fieldnote-zz99")
    ).toBe("/fieldnote-zz99/geo/prompts");
    expect(resolveDemoLanding("/fieldnote-ab12cd34", "fieldnote-zz99")).toBe(
      "/fieldnote-zz99"
    );
    expect(resolveDemoLanding(null, "fieldnote-zz99")).toBe(
      "/fieldnote-zz99/geo"
    );
  });
});
