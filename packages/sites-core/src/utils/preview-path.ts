/**
 * Where a preview login may send the visitor afterwards: a path on the same
 * host. Anything else (`//evil.com`, `/\evil.com`, `https://…`) becomes `/`,
 * because browsers read a backslash like a slash and would leave the host.
 */
export function safePreviewNextPath(next: string | null | undefined): string {
  if (!next?.startsWith("/") || next.includes("\\")) {
    return "/";
  }
  try {
    const base = "https://preview.invalid";
    const resolved = new URL(next, base);
    if (resolved.origin !== base) {
      return "/";
    }
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return "/";
  }
}
