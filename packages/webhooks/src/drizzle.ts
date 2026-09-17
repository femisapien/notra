import { sql, type SQL } from "drizzle-orm";

import { WebhookStorageError } from "./errors/webhooks";
import {
  buildEventRecord,
  EVENT_INSERT_QUERY,
  EVENT_SELECT_BY_SOURCE_QUERY,
  eventInsertParameters,
  eventSelectBySourceParameters,
} from "./programs/events";

// The minimal part of a drizzle database or transaction handle this module
// needs. Both NodePgDatabase and its transaction objects satisfy it.
export interface DrizzleExecutor {
  execute(query: SQL): Promise<unknown>;
}

// Converts the parameterized "$n" statements shared with the Effect programs
// into drizzle SQL templates so the raw SQL stays single-sourced. Only safe
// for statements without "$n" sequences inside string literals — all webhook
// statements satisfy that.
const toDrizzleSql = (query: string, parameters: readonly unknown[]): SQL => {
  const chunks: SQL[] = [];
  let lastIndex = 0;
  for (const match of query.matchAll(/\$(\d+)/g)) {
    if (match.index > lastIndex) {
      chunks.push(sql.raw(query.slice(lastIndex, match.index)));
    }
    const parameter = parameters[Number(match[1]) - 1];
    chunks.push(sql`${parameter}`);
    lastIndex = match.index + match[0].length;
  }
  chunks.push(sql.raw(query.slice(lastIndex)));
  return sql.join(chunks, sql.raw(""));
};

// tx.execute resolves to a driver-specific shape: node-postgres and pglite
// return a result object with `rows`, postgres-js returns the rows array
// directly. Normalize both.
const rowsOf = <T>(result: unknown): T[] => {
  if (Array.isArray(result)) {
    return result as T[];
  }
  if (typeof result === "object" && result !== null && "rows" in result) {
    const { rows } = result as { rows: unknown };
    if (Array.isArray(rows)) {
      return rows as T[];
    }
  }
  return [];
};

// Transactional variant of publishEvent: identical statement, identical
// payload, but executed on the caller's drizzle transaction so the webhook
// outbox row commits or rolls back together with the surrounding write.
// Throws WebhookValidationError on invalid input and WebhookStorageError if
// the insert produced no row; both roll the transaction back, making the
// caller's retry safe through the (organization_id, source_key) dedupe.
export const publishEventInTransaction = async (
  tx: DrizzleExecutor,
  input: unknown
): Promise<string> => {
  const record = buildEventRecord(input);
  const [inserted] = rowsOf<{ id: string }>(
    await tx.execute(
      toDrizzleSql(EVENT_INSERT_QUERY, eventInsertParameters(record))
    )
  );
  const existing =
    inserted ??
    rowsOf<{ id: string }>(
      await tx.execute(
        toDrizzleSql(
          EVENT_SELECT_BY_SOURCE_QUERY,
          eventSelectBySourceParameters(record)
        )
      )
    )[0];
  if (!existing) {
    throw new WebhookStorageError({
      operation: "publishEventInTransaction",
      cause: "Event insert returned no row",
    });
  }
  return existing.id;
};
