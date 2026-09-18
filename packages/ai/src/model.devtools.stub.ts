import type { GatewayResult } from "@notra/ai/types/gateway";

export function wrapModelWithDevTools(model: GatewayResult): GatewayResult {
  return model;
}
