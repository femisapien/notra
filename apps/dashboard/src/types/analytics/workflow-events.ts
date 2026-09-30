import type { PostHogProperties } from "@notra/posthog/types/posthog";

import type {
  WORKFLOW_ANALYTICS_NAMES,
  WORKFLOW_OUTCOMES,
} from "@/constants/workflow-analytics";

export type WorkflowAnalyticsName =
  (typeof WORKFLOW_ANALYTICS_NAMES)[keyof typeof WORKFLOW_ANALYTICS_NAMES];


export type WorkflowOutcome =
  (typeof WORKFLOW_OUTCOMES)[keyof typeof WORKFLOW_OUTCOMES];

export interface WorkflowStartedInput {
  workflow: WorkflowAnalyticsName;
  runId: string;
  organizationId?: string | null;
  projectId?: string | null;
  userId?: string | null;
  trigger?: string;
  properties?: PostHogProperties;
}

export interface WorkflowOutcomeInput {
  workflow: WorkflowAnalyticsName;
  outcome: WorkflowOutcome;
  organizationId?: string | null;
  projectId?: string | null;
  runId?: string;
  startedAt?: number;
  stepFailed?: string;
  reason?: string;
  properties?: PostHogProperties;
}

export interface WorkflowLifecycleFields {
  workflow?: WorkflowAnalyticsName;
  startedAt?: number;
}

export interface StepErrorContext {
  workflow: WorkflowAnalyticsName;
  step: string;
  organizationId?: string | null;
}

export interface OnboardingAgentStartedInput {
  organizationId: string;
  runId?: string;
}
