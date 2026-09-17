import { DateTime, Effect, Schema } from "effect";

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

// Shared by the Effect pipeline and the transactional drizzle adapter so both
// produce byte-identical payloads.
export const buildEventRecord = Effect.fn("webhooks.buildEventRecord")(
  function* (input: unknown) {
    const body = yield* Schema.decodeUnknownEffect(PublishInput)(input).pipe(
      Effect.mapError(
        () => new WebhookValidationError({ message: "Invalid webhook event" })
      )
    );
    const id = yield* Effect.sync(() => `whev_${crypto.randomUUID()}`);
    const createdAt = yield* DateTime.now;
    const payload = JSON.stringify({
      id,
      type: body.event.type,
      apiVersion: API_VERSION,
      createdAt: DateTime.formatIso(createdAt),
      organizationId: body.organizationId,
      data: body.event.data,
    });
    if (new TextEncoder().encode(payload).length > MAX_PAYLOAD_BYTES) {
      return yield* new WebhookValidationError({
        message: "Webhook payload exceeds 64 KiB",
      });
    }
    return { id, body, payload } satisfies EventRecord;
  }
);

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
  const record = yield* buildEventRecord(input);
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
