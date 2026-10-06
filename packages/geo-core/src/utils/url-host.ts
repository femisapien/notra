/** Lower-case hostname of an absolute URL, or null when it doesn't parse. */
export function urlHost(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}
