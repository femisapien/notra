import { describe, expect, test } from "bun:test";

import { retryWrite } from "./retry-write";

describe("retryWrite", () => {
  test("rejects invalid attempt counts without running the write", async () => {
    let runs = 0;
    const write = async () => {
      runs++;
    };
    for (const attempts of [Number.NaN, Number.POSITIVE_INFINITY, 0, 1.5]) {
      await expect(retryWrite(write, attempts)).rejects.toThrow(
        "positive finite integer"
      );
    }
    expect(runs).toBe(0);
  });
});
