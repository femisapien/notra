import type { ReactNode } from "react";

export interface PerplexitySearchLabels {
  showLess: string;
  more: (count: number) => string;
}

export type PerplexityModelId = "sonar" | "sonar-pro" | "reasoning";

export type PerplexityModelGroup = "search" | "reason";

export type PerplexityModelProvider =
  | "perplexity"
  | "openai"
  | "google"
  | "anthropic"
  | "kimi"
  | "zhipu"
  | "nvidia";

export type PerplexityModelBadge = "max" | "new";

export interface PerplexityModelOption {
  id: PerplexityModelId;
  label: string;
  chip: string;
  description: string;
  group: PerplexityModelGroup;
}

export interface PerplexityModelMenuItem {
  id: string;
  label: string;
  provider: PerplexityModelProvider;
  badge?: PerplexityModelBadge;
  locked?: boolean;
}

export type PerplexityFocusId = "search" | "research";

export interface PerplexityFocusOption {
  id: PerplexityFocusId;
  label: string;
  description: string;
}

export interface PerplexitySearchSource {
  title: string;
  domain: string;
  verified?: boolean;
  url?: string;
}

export interface PerplexitySearchProps {
  title: string;
  queries: readonly string[];
  sources: readonly PerplexitySearchSource[];
  extraCount?: number;
  previewCount?: number;
  defaultOpen?: boolean;
  sequential?: boolean;
  reducedMotion?: boolean;
  emptyDescription?: string;
  className?: string;
  labels?: PerplexitySearchLabels;
}

export interface PerplexityResearchProps {
  status?: "researching" | "researched";
  duration?: string;
  defaultOpen?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface PerplexityResearchStepProps {
  title: string;
  defaultOpen?: boolean;
  className?: string;
  children?: ReactNode;
}
