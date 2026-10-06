import { Effect } from "effect";

import type { GeoIngestTimings } from "../types/ingest";

export function measureGeoIngestStage<A, E, R>(
  timings: GeoIngestTimings | undefined,
  stage: keyof GeoIngestTimings,
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> {
  if (!timings) {
    return effect;
  }
  return Effect.suspend(() => {
    const startedAt = performance.now();
    return effect.pipe(
      Effect.ensuring(
        Effect.sync(() => {
          timings[stage] = Math.round(performance.now() - startedAt);
        })
      )
    );
  });
}
