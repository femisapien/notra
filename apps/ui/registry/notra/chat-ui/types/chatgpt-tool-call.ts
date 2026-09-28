import type { ReactNode } from "react";

export interface ChatgptToolCallProps {
  tool: string;
  input: string;
  result: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}
