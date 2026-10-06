export interface AcornSyntaxError {
  /** The message without acorn's `(line:column)` suffix. */
  message: string;
  /** Source offset the error points at. */
  offset: number;
}

/** Where micromark reports an MDX syntax error; either a point or a range. */
export interface MicromarkErrorPlace {
  line?: number;
  column?: number;
  start?: { line: number; column: number };
}
