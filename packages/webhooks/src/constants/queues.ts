export const EVENT_QUEUE_NAME = "notra-webhook-events";
export const DELIVERY_QUEUE_NAME = "notra-webhook-deliveries";
// Queue.sendBatch accepts at most 100 messages per call.
export const SEND_BATCH_CHUNK = 100;
