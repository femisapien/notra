import type {
  SiteBuildRequestInput,
  SiteBuildResult,
} from "@notra/sites-core/types/build";

export interface SandboxBuildResult {
  /** Validated against the shared contract; null when the sandbox produced no (valid) result. */
  result: SiteBuildResult | null;
  /** Human-readable reason when `result` is null. */
  crash: string | null;
  log: string;
  outputArchive: Uint8Array<ArrayBuffer> | null;
  toolchainVersion: string | null;
  durationMs: number;
}

export interface SandboxBuildParams {
  sourceArchive: Uint8Array<ArrayBuffer>;
  rootDirectory: string;
  target: SiteBuildRequestInput;
  /** Receives the build log while the build runs, so the dashboard can follow it live. */
  onLog?: (log: string) => Promise<void>;
}

export interface SandboxUploadFile {
  path: string;
  data: Uint8Array<ArrayBuffer>;
}

export interface BuildLogFollower {
  stop: () => Promise<void>;
}
