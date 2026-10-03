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
