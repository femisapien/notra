/**
 * Serving state is re-read at most this often per isolate. It bounds how long
 * a takedown or a new release takes to show up, independent of any edge cache.
 */
export const STATE_TTL_MS = 5000;
export const HOST_TTL_MS = 30_000;
export const MANIFEST_CACHE_LIMIT = 32;
