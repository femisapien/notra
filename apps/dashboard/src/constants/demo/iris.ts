import { DEMO_POSTS } from "@/constants/demo/content";
import { DEMO_ORGANIZATION } from "@/constants/demo/workspace";
import type {
  IrisOverview,
  IrisListRunsResult,
  IrisSignalView,
} from "@/types/iris";
export const DEMO_IRIS_RUNS: IrisListRunsResult = {
  nextCursor: null,
  runs: DEMO_POSTS.filter((post) => post.status === "draft")
    .slice(0, 3)
    .map((post, index) => ({
      id: `demo-iris-run-${index}`,
      trigger: "wake",
      status: "completed",
      decision: "act",
      reason:
        [
          "A recurring developer question is not covered by a practical migration walkthrough.",
          "The weekly developer story is due for editorial review.",
          "A connection-pooling explanation would address recent agent feedback.",
        ][index] ?? "Prepare a draft for review.",
      costCents: 38 + index * 7,
      startedAt: `2026-09-${28 - index}T08:00:00Z`,
      completedAt: `2026-09-${28 - index}T08:04:00Z`,
      goal: {
        id: `demo-goal-${index}`,
        title: post.title,
        summary:
          "Prepare useful developer content and leave publication to the team.",
        status: "completed",
      },
      tasks: [],
      actions: [],
      outbox: [],
      artifacts: [
        {
          postId: post.id,
          title: post.title,
          contentType: post.contentType,
          excerpt: (post.markdown ?? "").slice(0, 180),
          status: "draft",
        },
      ],
    })),
};
export const DEMO_IRIS: IrisOverview = {
  enabled: true,
  slackReady: true,
  slackChannelName: "content-review",
  mandate: {
    id: "demo-mandate",
    organizationId: DEMO_ORGANIZATION.id,
    name: "Developer education",
    objective:
      "Turn product changes and recurring developer questions into practical Postgres content. Submit drafts for review.",
    status: "active",
    version: 1,
    autoPublish: false,
    maxActionsPerDay: 3,
    maxTasksPerPlan: 4,
    qstashScheduleId: null,
    pausedAt: null,
    createdAt: "2026-09-04T08:00:00Z",
    updatedAt: "2026-09-25T08:00:00Z",
  },
  stats: {
    runs30d: DEMO_IRIS_RUNS.runs.length,
    artifacts30d: DEMO_IRIS_RUNS.runs.length,
    signalsPending: 1,
    lastRunAt: "2026-09-28T08:00:00Z",
  },
};
export const DEMO_IRIS_SIGNALS: IrisSignalView[] = [
  {
    id: "demo-signal-0",
    source: "github",
    kind: "release",
    status: "pending",
    sourceEventId: null,
    occurredAt: "2026-09-28T10:00:00Z",
    processedAt: null,
  },
  {
    id: "demo-signal-1",
    source: "agent_feedback",
    kind: "question",
    status: "processed",
    sourceEventId: null,
    occurredAt: "2026-09-27T10:00:00Z",
    processedAt: "2026-09-28T08:00:00Z",
  },
];
