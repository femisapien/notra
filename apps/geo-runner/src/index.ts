import { ManagedRuntime } from "effect";

import {
  RUNNER_DEFAULT_PORT,
  RUNNER_IDLE_TIMEOUT_SECONDS,
  RUNNER_MAX_REQUEST_BODY_BYTES,
} from "./constants/runner";
import { createApp } from "./http/routes";
import { RunQueue, runQueueLive } from "./services/run-queue";

const runtime = ManagedRuntime.make(runQueueLive);
const queue = await runtime.runPromise(RunQueue);
const app = createApp(queue, process.env.GEO_RUNNER_SECRET);

// Railway sends SIGTERM on redeploy. Disposing interrupts in-flight scans,
// which mark themselves failed and release their billing reservation.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    void runtime.dispose().finally(() => process.exit(0));
  });
}

export default {
  port: process.env.PORT ?? RUNNER_DEFAULT_PORT,
  idleTimeout: RUNNER_IDLE_TIMEOUT_SECONDS,
  maxRequestBodySize: RUNNER_MAX_REQUEST_BODY_BYTES,
  fetch: app.fetch,
};
