import type { drizzle } from "drizzle-orm/node-postgres";

export type PooledDatabase = ReturnType<
  typeof drizzle<typeof import("../schema")>
>;
