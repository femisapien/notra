import type { ReactNode } from "react";

export interface ClaudeChatToolCallProps {
  tool: string;
  input: string;
  result: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}
