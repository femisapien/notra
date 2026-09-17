import { Array, Context, Effect, Layer } from "effect";

import { WebhookQueueError } from "../errors/webhooks";
import type { WebhookQueuesService } from "../types/services";
import type { WorkerBindings } from "../types/worker";

export class WebhookQueues extends Context.Service<
  WebhookQueues,
  WebhookQueuesService
>()("@notra/webhooks/Queues") {}

// Queue.sendBatch accepts at most 100 messages per call.
const SEND_BATCH_CHUNK = 100;

export const cloudflareQueuesLayer = (
  bindings: Pick<WorkerBindings, "EVENT_QUEUE" | "DELIVERY_QUEUE">
) =>
  Layer.succeed(
    WebhookQueues,
    WebhookQueues.of({
      event: (eventId) =>
        Effect.tryPromise({
          try: () => bindings.EVENT_QUEUE.send({ eventId }),
          catch: () => new WebhookQueueError({ operation: "event.send" }),
        }),
      delivery: (deliveryId) =>
        Effect.tryPromise({
          try: () => bindings.DELIVERY_QUEUE.send({ deliveryId }),
          catch: () => new WebhookQueueError({ operation: "delivery.send" }),
        }),
      deliveries: Effect.fn("webhooks.queues.deliveries")(
        function* (deliveryIds) {
          yield* Effect.forEach(
            Array.chunksOf(deliveryIds, SEND_BATCH_CHUNK),
            (chunk) =>
              Effect.tryPromise({
                try: () =>
                  bindings.DELIVERY_QUEUE.sendBatch(
                    chunk.map((deliveryId) => ({ body: { deliveryId } }))
                  ),
                catch: () =>
                  new WebhookQueueError({ operation: "delivery.sendBatch" }),
              }),
            { discard: true }
          );
        }
      ),
    })
  );
