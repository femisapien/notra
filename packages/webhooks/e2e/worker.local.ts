// LOCAL TEST ONLY — identical handler logic to src/worker.ts, but the database
// layer uses the `pg` pool (postgresDatabaseLayer) instead of Neon HTTP, so the
// worker can run against the local Docker Postgres under `wrangler dev`.
// Everything else (queues, cron, transport, crypto, programs) is the real code.
import { Config, ConfigProvider, Effect, Layer, Schema } from "effect";

import { DELIVERY_QUEUE_NAME, EVENT_QUEUE_NAME } from "../src/constants/queues";
import { WebhookValidationError } from "../src/errors/webhooks";
import { deliver } from "../src/programs/deliveries";
import {
  cleanup,
  dispatchEvent,
  emitMetrics,
  recover,
} from "../src/programs/recovery";
import { postgresDatabaseLayer } from "../src/runtime/postgres";
import { DeliveryMessage, EventMessage } from "../src/schemas/webhooks";
import { webCryptoLayer } from "../src/services/crypto";
import { cloudflareQueuesLayer } from "../src/services/queue";
import { cloudflareTransportLayer } from "../src/services/transport";
import type { WorkerBindings } from "../src/types/worker";

const localWorkerLayer = (bindings: WorkerBindings) =>
  Layer.mergeAll(
    postgresDatabaseLayer,
    Layer.unwrap(
      Effect.map(Config.redacted("WEBHOOK_ENCRYPTION_KEY"), webCryptoLayer)
    ),
    cloudflareQueuesLayer(bindings),
    cloudflareTransportLayer
  ).pipe(
    Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(bindings)))
  );

export default {
  queue(batch: MessageBatch<unknown>, bindings: WorkerBindings) {
    return Effect.runPromise(
      Effect.forEach(
        batch.messages,
        (message) =>
          Effect.gen(function* () {
            if (batch.queue === EVENT_QUEUE_NAME) {
              const body = yield* Schema.decodeUnknownEffect(EventMessage)(
                message.body
              );
              yield* dispatchEvent(body.eventId);
            } else if (batch.queue === DELIVERY_QUEUE_NAME) {
              const body = yield* Schema.decodeUnknownEffect(DeliveryMessage)(
                message.body
              );
              yield* deliver(body.deliveryId);
            } else {
              return yield* new WebhookValidationError({
                message: "Unknown queue",
              });
            }
            yield* Effect.sync(() => message.ack());
          }).pipe(
            Effect.catch((error) =>
              Effect.gen(function* () {
                yield* Effect.logError("Webhook queue processing failed").pipe(
                  Effect.annotateLogs({
                    queue: batch.queue,
                    messageId: message.id,
                    errorType: error._tag,
                  })
                );
                yield* Effect.sync(() => message.retry({ delaySeconds: 60 }));
              })
            )
          ),
        { concurrency: 5, discard: true }
      ).pipe(Effect.provide(localWorkerLayer(bindings)))
    );
  },
  scheduled(_controller: ScheduledController, bindings: WorkerBindings) {
    return Effect.runPromise(
      Effect.gen(function* () {
        yield* recover();
        yield* cleanup();
        yield* emitMetrics();
      }).pipe(Effect.provide(localWorkerLayer(bindings)))
    );
  },
} satisfies ExportedHandler<WorkerBindings, unknown>;
