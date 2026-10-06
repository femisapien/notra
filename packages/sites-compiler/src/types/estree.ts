export interface SourceRange {
  start: number;
  end: number;
}

export interface ForbiddenSyntax {
  message: string;
  start: number;
}

/** An identifier used as a value, with its source offsets (-1 when unknown). */
export interface IdentifierReference {
  name: string;
  start: number;
  end: number;
}
