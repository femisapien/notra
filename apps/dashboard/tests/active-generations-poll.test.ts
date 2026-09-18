import { describe, expect, test } from "bun:test";

import { activeGenerationsPollInterval } from "../src/utils/active-generations-poll";

describe("activeGenerationsPollInterval", () => {
  test("does not poll when nothing is generating", () => {
    expect(activeGenerationsPollInterval(undefined)).toBe(false);
    expect(activeGenerationsPollInterval([])).toBe(false);
  });

  test("polls while generations are in flight", () => {
    expect(activeGenerationsPollInterval([{ id: "run-1" }])).toBe(3000);
  });
});
