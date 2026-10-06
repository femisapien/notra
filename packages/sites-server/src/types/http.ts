export interface CappedBody {
  bytes: Uint8Array<ArrayBuffer>;
  /** The body was longer than allowed; `bytes` holds what was read up to then. */
  exceeded: boolean;
}
