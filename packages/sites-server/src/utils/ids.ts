/** `site_…`, `dep_…`: a random id with a readable type prefix. */
export function prefixedId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}
