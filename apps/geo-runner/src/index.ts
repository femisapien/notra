import { Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";

import {
  RUNNER_DEFAULT_PORT,
  RUNNER_IDLE_TIMEOUT_SECONDS,
} from "./constants/runner";
import { routes } from "./http/routes";
import { runQueueLive } from "./services/run-queue";

const { handler, dispose } = HttpRouter.toWebHandler(
  routes.pipe(Layer.provide(runQueueLive))
);

// Railway sends SIGTERM on redeploy. Disposing interrupts in-flight scans,
// which mark themselves failed and release their billing reservation.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    void dispose().finally(() => process.exit(0));
  });
}

export default {
  port: process.env.PORT ?? RUNNER_DEFAULT_PORT,
  idleTimeout: RUNNER_IDLE_TIMEOUT_SECONDS,
  fetch: (request: Request) => handler(request),
};
