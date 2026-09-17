import { Effect, Result, Schema } from "effect";

import { API_VERSION, MAX_PAYLOAD_BYTES } from "../constants/delivery";
import {
  WebhookStorageError,
  WebhookValidationError,
} from "../errors/webhooks";
import { EventId, IdentifierRow, PublishInput } from "../schemas/webhooks";
import { queryRows } from "../services/database";

export type PublishBody = typeof PublishInput.Type;

export interface EventRecord {
  readonly id: string;
  readonly body: PublishBody;
  readonly payload: string;
}

// Pure validation + payload building, shared by the Effect pipeline
// (publishEvent) and the transactional drizzle adapter
// (publishEventInTransaction) so both produce byte-identical payloads.
// Throws WebhookValidationError on invalid input.
export const buildEventRecord = (input: unknown): EventRecord => {
  const decoded = Schema.decodeUnknownResult(PublishInput)(input);
  if (Result.isFailure(decoded)) {
    throw new WebhookValidationError({ message: "Invalid webhook event" });
  }
  const body = decoded.success;
  const id = `whev_${crypto.randomUUID()}`;
  const payload = JSON.stringify({
    id,
    type: body.event.type,
    apiVersion: API_VERSION,
    createdAt: new Date().toISOString(),
    organizationId: body.organizationId,
    data: body.event.data,
  });
  if (new TextEncoder().encode(payload).length > MAX_PAYLOAD_BYTES) {
    throw new WebhookValidationError({
      message: "Webhook payload exceeds 64 KiB",
    });
  }
  return { id, body, payload };
};

// The event row and its per-endpoint delivery rows are one statement so a
// subscription snapshot is created atomically with the event.
export const EVENT_INSERT_QUERY = `WITH inserted AS (
    INSERT INTO webhook_events (id, organization_id, source_key, event_type, payload)
    VALUES ($1, $2, $3, $4, $5) ON CONFLICT (organization_id, source_key) DO NOTHING RETURNING *
  ), deliveries AS (
    INSERT INTO webhook_deliveries (id, organization_id, event_id, endpoint_id, url, secret)
    SELECT inserted.id || '_' || endpoint.id, inserted.organization_id, inserted.id, endpoint.id, endpoint.url, endpoint.secret
    FROM inserted JOIN webhook_endpoints endpoint ON endpoint.organization_id = inserted.organization_id
    WHERE endpoint.enabled AND endpoint.deleted_at IS NULL AND inserted.event_type = ANY(endpoint.events)
    ON CONFLICT (event_id, endpoint_id) DO NOTHING
  ) SELECT id FROM inserted`;

export const eventInsertParameters = (record: EventRecord) =>
  [
    record.id,
    record.body.organizationId,
    record.body.sourceKey,
    record.body.event.type,
    record.payload,
  ] as const;

export const EVENT_SELECT_BY_SOURCE_QUERY =
  "SELECT id FROM webhook_events WHERE organization_id = $1 AND source_key = $2";

export const eventSelectBySourceParameters = (record: EventRecord) =>
  [record.body.organizationId, record.body.sourceKey] as const;

export const publishEvent = Effect.fn("webhooks.publishEvent")(function* (
  input: unknown
) {
  const record = yield* Effect.try({
    try: () => buildEventRecord(input),
    catch: (cause) =>
      cause instanceof WebhookValidationError
        ? cause
        : new WebhookValidationError({ message: "Invalid webhook event" }),
  });
  const [event] = yield* queryRows(
    IdentifierRow,
    EVENT_INSERT_QUERY,
    eventInsertParameters(record)
  );
  const existing =
    event ??
    (yield* queryRows(
      IdentifierRow,
      EVENT_SELECT_BY_SOURCE_QUERY,
      eventSelectBySourceParameters(record)
    ))[0];
  if (!existing) {
    return yield* new WebhookStorageError({
      operation: "publishEvent",
      cause: "Event insert returned no row",
    });
  }
  return yield* Schema.decodeUnknownEffect(EventId)(existing.id);
});
