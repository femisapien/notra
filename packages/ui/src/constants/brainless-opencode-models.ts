import type { OpencodeModelOption } from "@notra/ui/types/brainless-opencode";

export const OPENCODE_MODELS: readonly OpencodeModelOption[] = [
  { id: "gpt-5.6-sol", label: "GPT-5.6 Sol", provider: "OpenAI" },
  { id: "muse-spark-1.3", label: "Muse Spark 1.3 Free", provider: "OpenCode Zen" },
];

export const OPENCODE_AGENTS = ["Build", "Plan"] as const;
export const OPENCODE_EFFORTS = ["low", "medium", "high", "xhigh"] as const;
