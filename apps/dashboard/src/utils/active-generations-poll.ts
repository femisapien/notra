export const ACTIVE_GENERATIONS_POLL_MS = 3000;

export function activeGenerationsPollInterval(
  generations: { length: number } | undefined
): number | false {
  if (!generations || generations.length === 0) {
    return false;
  }
  return ACTIVE_GENERATIONS_POLL_MS;
}
