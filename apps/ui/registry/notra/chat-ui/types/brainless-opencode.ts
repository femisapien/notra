import type * as React from "react";

export type OpencodeActivityKind = "thought" | "tool";

export interface OpencodeActivityProps {
  kind?: OpencodeActivityKind;
  label: string;
  detail?: string;
  duration?: string;
  className?: string;
}

export interface OpencodeComposerProps {
  value?: string;
  defaultValue?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onSend?: (text: string) => void;
  placeholder?: string;
  agent?: string;
  defaultAgent?: string;
  onAgentChange?: (agent: string) => void;
  model?: string;
  defaultModel?: string;
  models?: readonly OpencodeModelOption[];
  onModelChange?: (model: OpencodeModelOption) => void;
  provider?: string;
  effort?: string;
  defaultEffort?: string;
  onEffortChange?: (effort: string) => void;
  context?: string;
  footer?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  ref?: React.Ref<HTMLInputElement>;
}

export interface OpencodeModelOption {
  id: string;
  label: string;
  provider: string;
}

export interface OpencodeLogoProps {
  className?: string;
  scale?: number;
}

export interface OpencodeMessageProps {
  from?: "user" | "assistant";
  search?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export type OpencodeMcpStatus = "Connected" | "Disconnected" | "Error";

export interface OpencodeMcpServer {
  name: string;
  status?: OpencodeMcpStatus;
}

export interface OpencodeSidebarProps {
  title?: string;
  tokens?: string;
  used?: string;
  spent?: string;
  servers?: OpencodeMcpServer[];
  cwd?: string;
  version?: string;
  className?: string;
}

export interface OpencodeSource {
  title: string;
  domain: string;
  url?: string;
}

export interface OpencodeSourcesLabels {
  citedSources: (count: number) => string;
  openSource: (title: string, domain: string) => string;
}

export interface OpencodeSourcesProps {
  labels?: OpencodeSourcesLabels;
  darkSurface?: boolean;
  sources: readonly OpencodeSource[];
  queries?: readonly string[];
  sequential?: boolean;
  reducedMotion?: boolean;
  className?: string;
}
