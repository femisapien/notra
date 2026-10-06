/** A `{{ name }}` with no value in notra.json `variables`. */
export interface UnknownVariable {
  name: string;
  /** Offset of the `{{` in the original source. */
  offset: number;
}

export interface VariableSubstitution {
  text: string;
  unknown: UnknownVariable[];
}

/** A run of lines outside (or inside) a fenced code block. */
export interface TextSegment {
  start: number;
  end: number;
  code: boolean;
}

/** `{{ name }}` substituted in a short setting; `unknown` lists names without a value. */
export interface SettingSubstitution {
  text: string;
  unknown: string[];
}
