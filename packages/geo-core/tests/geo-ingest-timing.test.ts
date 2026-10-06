import { expect, test } from "bun:test";

import { Effect } from "effect";

import type { GeoIngestTimings } from "../src/types/ingest";
import { measureGeoIngestStage } from "../src/utils/geo-ingest-timing";

test("records a stage only when the effect runs and preserves its value", async () => {
  const timings: GeoIngestTimings = {};
  const effect = measureGeoIngestStage(
    timings,
    "identityMs",
    Effect.succeed(42)
  );
  expect(timings.identityMs).toBeUndefined();
  expect(await Effect.runPromise(effect)).toBe(42);
  expect(timings.identityMs).toBeNumber();
  expect(timings.identityMs).toBeGreaterThanOrEqual(0);
});

test("records failed stages without changing the typed failure", async () => {
  const timings: GeoIngestTimings = {};
  const result = await Effect.runPromise(
    Effect.result(
      measureGeoIngestStage(timings, "admissionMs", Effect.fail("unavailable"))
    )
  );
  expect(result._tag).toBe("Failure");
  if (result._tag === "Failure") {
    expect(result.failure).toBe("unavailable");
  }
  expect(timings.admissionMs).toBeNumber();
});

test("does not wrap effects when no timings are requested", () => {
  const effect = Effect.succeed(42);
  expect(measureGeoIngestStage(undefined, "hostsMs", effect)).toBe(effect);
});
