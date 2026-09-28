export type ChatgptModelId =
  | "sol"
  | "terra"
  | "luna"
  | "gpt-5.5"
  | "gpt-5.4"
  | "gpt-5.4-mini";

export type ChatgptEffortId = "instant" | "medium" | "high" | "extra-high";

export type ChatgptMessageRole = "user" | "assistant";

export interface ChatgptModelOption {
  id: ChatgptModelId;
  label: string;
}

export interface ChatgptEffortOption {
  id: ChatgptEffortId;
  label: string;
}

export interface ChatgptBlockMessage {
  id: string;
  from: ChatgptMessageRole;
  content: ReactNode;
  text?: string;
  reasoning?: ReactNode;
  tools?: ReactNode;
}

export interface ChatgptBlockProps {
  messages: ChatgptBlockMessage[];
  onSend?: (text: string) => void;
  onStop?: () => void;
  onAdd?: () => void;
  onShareMessage?: (id: string) => void;
  onRedoMessage?: (id: string) => void;
  onMoreMessage?: (id: string) => void;
  busy?: boolean;
  className?: string;
}
import type { ReactNode } from "react";
