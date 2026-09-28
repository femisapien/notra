import type {
  ChangeEventHandler,
  KeyboardEventHandler,
  ReactNode,
} from "react";

import type {
  OpencodeModelOption,
  OpencodeSidebarProps,
} from "./brainless-opencode";

export interface ChatBlockMessage {
  id: string;
  from: "user" | "assistant";
  content: ReactNode;
  text?: string;
  search?: ReactNode;
  status?: ReactNode;
  reasoning?: ReactNode;
  sources?: ReactNode;
}

export interface ChatBlockProps {
  messages: ChatBlockMessage[];
  onSend?: (text: string) => void;
  onStop?: () => void;
  busy?: boolean;
  className?: string;
}

export interface TerminalChatBlockProps {
  children: ReactNode;
  className?: string;
  value?: string;
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  placeholder?: string;
}

export interface OpencodeChatBlockProps extends TerminalChatBlockProps {
  onSend?: (text: string) => void;
  agent?: string;
  onAgentChange?: (agent: string) => void;
  model?: string;
  models?: readonly OpencodeModelOption[];
  onModelChange?: (model: OpencodeModelOption) => void;
  provider?: string;
  effort?: string;
  onEffortChange?: (effort: string) => void;
  context?: string;
  cwd?: string;
  sidebar?: OpencodeSidebarProps | false;
  footer?: ReactNode;
}

export interface OpencodeStartBlockProps extends Omit<
  OpencodeChatBlockProps,
  "children" | "footer"
> {
  cwd?: string;
  version?: string;
  tip?: ReactNode;
}
