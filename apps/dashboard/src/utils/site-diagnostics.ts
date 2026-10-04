import type { SiteDiagnostic } from "@/types/sites";

/** `file:line:column` as far as the diagnostic knows it; null without a file. */
export function siteDiagnosticLocation(
  diagnostic: SiteDiagnostic
): string | null {
  if (!diagnostic.file) {
    return null;
  }
  if (diagnostic.line === undefined) {
    return diagnostic.file;
  }
  return diagnostic.column === undefined
    ? `${diagnostic.file}:${diagnostic.line}`
    : `${diagnostic.file}:${diagnostic.line}:${diagnostic.column}`;
}

/** Sort key that lists errors before warnings. */
export function siteDiagnosticSeverityRank(diagnostic: SiteDiagnostic): number {
  return diagnostic.severity === "error" ? 0 : 1;
}

/**
 * Diagnostics carry no id. File, position, code and message identify one; the
 * occurrence count separates exact repeats, so keys survive re-sorting.
 */
export function withDiagnosticKeys<T extends SiteDiagnostic>(
  diagnostics: readonly T[]
): { diagnostic: T; key: string }[] {
  const seen = new Map<string, number>();
  return diagnostics.map((diagnostic) => {
    const signature = [
      diagnostic.file ?? "",
      diagnostic.line ?? "",
      diagnostic.column ?? "",
      diagnostic.code,
      diagnostic.message,
    ].join(":");
    const occurrence = seen.get(signature) ?? 0;
    seen.set(signature, occurrence + 1);
    return { diagnostic, key: `${signature}#${occurrence}` };
  });
}
