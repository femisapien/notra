/** `notra/site-edit-20260106143000`: unique per second, sortable. */
export function timestampedBranchName(prefix: string, now: Date): string {
  return `${prefix}${now.toISOString().replace(/[-:T]/g, "").slice(0, 14)}`;
}
