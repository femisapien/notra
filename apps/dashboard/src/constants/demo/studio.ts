import { DEMO_POSTS } from "@/constants/demo/content";
import { DEMO_BRAND, DEMO_ORGANIZATION } from "@/constants/demo/workspace";
import type { AgentFeedbackItem } from "@/types/agent-feedback";
import type {
  LeaderboardResponse,
  SocialOverviewResponse,
  EngagementTimeseriesResponse,
  FollowerGrowthResponse,
  TopPostsResponse,
  PostingPerformanceResponse,
} from "@/types/analytics";
import type { BrandGuidelinesResponse } from "@/types/hooks/brand-guidelines";
import type { BrandReference } from "@/types/hooks/brand-references";
import type { GitHubIntegration } from "@/types/integrations";
import type { Trigger } from "@/types/triggers/triggers";

export const DEMO_ENGAGEMENT: EngagementTimeseriesResponse = {
  configured: true,
  points: Array.from({ length: 28 }, (_, day) => ({
    day: `2026-09-${String(day + 1).padStart(2, "0")}`,
    provider: "linkedin",
    providerAccountId: "demo-neon-linkedin",
    posts: DEMO_POSTS.filter(
      (post) =>
        post.contentType === "linkedin_post" &&
        post.status === "published" &&
        post.createdAt.slice(0, 10) ===
          `2026-09-${String(day + 1).padStart(2, "0")}`
    ).length,
    impressions: 620 + day * 37 + (day % 5) * 121,
    likes: 12 + (day % 17),
    replies: 2 + (day % 5),
    reposts: 3 + (day % 7),
  })),
};
export const DEMO_ANALYTICS: SocialOverviewResponse = {
  configured: true,
  accounts: [
    {
      provider: "linkedin",
      providerAccountId: "demo-neon-linkedin",
      accountId: "demo-linkedin",
      username: "neondatabase",
      displayName: "Neon",
      profileImageUrl: null,
      verified: true,
      followersCount: 12480,
      followingCount: 126,
      postsCount: 86,
      trackedPosts: DEMO_POSTS.filter(
        (post) =>
          post.contentType === "linkedin_post" && post.status === "published"
      ).length,
      impressions: DEMO_ENGAGEMENT.points.reduce(
        (sum, p) => sum + (p.impressions ?? 0),
        0
      ),
      likes: DEMO_ENGAGEMENT.points.reduce((sum, p) => sum + (p.likes ?? 0), 0),
      replies: DEMO_ENGAGEMENT.points.reduce(
        (sum, p) => sum + (p.replies ?? 0),
        0
      ),
      reposts: DEMO_ENGAGEMENT.points.reduce(
        (sum, p) => sum + (p.reposts ?? 0),
        0
      ),
      quotes: 0,
      bookmarks: 42,
      statsCapturedAt: "2026-09-28T09:00:00Z",
    },
  ],
};
export const DEMO_FOLLOWERS: FollowerGrowthResponse = {
  configured: true,
  points: DEMO_ENGAGEMENT.points.map((point, index) => ({
    day: point.day,
    provider: point.provider,
    providerAccountId: point.providerAccountId,
    followersCount: 11670 + index * 30,
  })),
};
export const DEMO_TOP_POSTS: TopPostsResponse = {
  configured: true,
  posts: DEMO_POSTS.filter(
    (post) =>
      post.contentType === "linkedin_post" && post.status === "published"
  ).map((post, index) => ({
    provider: "linkedin",
    platformPostId: post.id,
    providerAccountId: "demo-neon-linkedin",
    username: "neondatabase",
    profileImageUrl: null,
    content: post.markdown ?? post.title,
    url: null,
    postedAt: post.createdAt,
    impressions: 8400 - index * 1720,
    likes: 186 - index * 31,
    replies: 24 - index * 4,
    reposts: 38 - index * 7,
    bookmarks: 19 - index * 3,
    engagement: 248 - index * 42,
  })),
};
export const DEMO_POSTING: PostingPerformanceResponse = {
  configured: true,
  points: Array.from({ length: 5 }, (_, weekday) => ({
    weekday: weekday + 1,
    hour: 9 + (weekday % 3),
    posts: 2 + (weekday % 2),
    engagement: 180 + weekday * 23,
    impressions: 9200 + weekday * 1100,
    avgEngagement: (180 + weekday * 23) / (2 + (weekday % 2)),
  })),
};
export const DEMO_SCHEDULES: Trigger[] = (
  [
    {
      name: "Weekly developer update",
      outputType: "blog_post",
      sourceType: "cron",
      sourceConfig: {
        cron: { frequency: "weekly", dayOfWeek: 1, hour: 9, minute: 0 },
      },
    },
    {
      name: "Thursday engineering story",
      outputType: "linkedin_post",
      sourceType: "cron",
      sourceConfig: {
        cron: { frequency: "weekly", dayOfWeek: 4, hour: 10, minute: 30 },
      },
    },
  ] as const
).map((trigger, index) => ({
  ...trigger,
  id: `demo-schedule-${index}`,
  organizationId: DEMO_ORGANIZATION.id,
  targets: { repositoryIds: ["demo-repository"] },
  outputConfig: {
    brandVoiceId: DEMO_BRAND.id,
    instructions:
      "Explain the developer impact with a practical example. Leave the result as a draft for review.",
  },
  enabled: true,
  autoPublish: false,
  createdAt: "2026-09-03T10:00:00Z",
  updatedAt: "2026-09-25T10:00:00Z",
}));
export const DEMO_INTEGRATIONS: (GitHubIntegration & { type: "github" })[] = [
  {
    id: "demo-github",
    type: "github",
    displayName: "neondatabase",
    enabled: true,
    managedByGitHubApp: true,
    createdAt: "2026-09-03T10:00:00Z",
    repositories: [
      {
        id: "demo-repository",
        owner: "neondatabase",
        repo: "neon",
        defaultBranch: "main",
        enabled: true,
        hasWebhook: true,
      },
    ],
  },
];
export const DEMO_FEEDBACK: AgentFeedbackItem[] = (
  [
    {
      title: "Migration example needs a connection-pooling note",
      message:
        "I followed the example with a pooled URL. A note explaining which commands need a direct connection would have saved a troubleshooting step.",
      kind: "question",
      sentiment: "neutral",
      status: "new",
      agentClient: "Cursor",
    },
    {
      title: "Branching workflow is easy to automate",
      message:
        "The branch creation and cleanup steps were clear enough to turn into a repeatable preview workflow. The connection-string example was particularly useful.",
      kind: "praise",
      sentiment: "positive",
      status: "resolved",
      agentClient: "Claude Code",
    },
    {
      title: "Add a retry example for a suspended compute",
      message:
        "Please include a short TypeScript example that distinguishes connection wake-up from a failed authentication attempt.",
      kind: "feature",
      sentiment: "neutral",
      status: "triaged",
      agentClient: "Codex",
    },
  ] as const
).map((item, index) => ({
  ...item,
  id: `demo-feedback-${index}`,
  organizationId: DEMO_ORGANIZATION.id,
  projectId: "demo-neon-project",
  source: "mcp",
  agentModel: null,
  toolVersion: null,
  userAgent: null,
  contextUrl: "https://neon.com/docs/introduction/branching",
  externalId: null,
  idempotencyKey: null,
  metadata: { demo: true },
  resolvedAt: index === 1 ? "2026-09-26T10:00:00Z" : null,
  createdAt: `2026-09-${28 - index}T09:00:00Z`,
  updatedAt: "2026-09-28T09:00:00Z",
}));
export const DEMO_GUIDELINES: BrandGuidelinesResponse = {
  guideline: {
    id: "demo-guidelines",
    brandSettingsId: DEMO_BRAND.id,
    status: "ready",
    contextDevMeta: null,
    lastGeneratedAt: "2026-09-24T09:00:00Z",
    lastGenerationError: null,
    createdAt: "2026-09-01T09:00:00Z",
    updatedAt: "2026-09-24T09:00:00Z",
  },
  assets: [],
  screenshots: [],
  tokens: [],
  colors: [
    {
      id: "demo-green",
      guidelineId: "demo-guidelines",
      role: "primary",
      name: "Signal green",
      lightValue: "oklch(0.87 0.2 155)",
      darkValue: null,
      usage: "Illustrative brand palette for the demo",
      sortOrder: 0,
    },
    {
      id: "demo-ink",
      guidelineId: "demo-guidelines",
      role: "background",
      name: "Ink",
      lightValue: "oklch(0.18 0.01 260)",
      darkValue: null,
      usage: "Dark product surfaces",
      sortOrder: 1,
    },
  ],
  fonts: [
    {
      id: "demo-body-font",
      guidelineId: "demo-guidelines",
      role: "body",
      family: "Inter",
      weight: "400",
      size: "16px",
      lineHeight: "1.5",
      source: null,
      sortOrder: 0,
    },
  ],
};
export const DEMO_REFERENCES: BrandReference[] = DEMO_POSTS.slice(0, 3).map(
  (post, index) => ({
    id: `demo-reference-${index}`,
    brandSettingsId: DEMO_BRAND.id,
    type: "custom",
    content: post.markdown ?? post.title,
    metadata: null,
    note: "Lead with the developer problem. Explain the tradeoff and include a concrete next step.",
    sourceCapturedAt: null,
    sourceContentHash: null,
    sourceSnapshotKey: null,
    sourceUrl: null,
    supermemoryDocumentId: null,
    supermemoryMemoryId: null,
    supermemorySyncedAt: null,
    supermemoryLastSyncError: null,
    applicableTo: ["all"],
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  })
);
export const DEMO_SKILLS = [
  {
    id: "demo-skill-0",
    name: "developer-tutorial",
    description:
      "Write practical Postgres tutorials with prerequisites, runnable examples and clear tradeoffs.",
    isSystem: false,
    updatedAt: "2026-09-25T10:00:00Z",
  },
  {
    id: "demo-skill-1",
    name: "release-story",
    description:
      "Turn engineering changes into a concise story about what developers can do now.",
    isSystem: false,
    updatedAt: "2026-09-22T10:00:00Z",
  },
];

export const DEMO_LEADERBOARD: LeaderboardResponse = {
  configured: true,
  days: 30,
  entries: DEMO_ANALYTICS.accounts.map((account) => ({
    ...account,
    key: `${account.provider}:${account.providerAccountId}`,
    verifiedType: null,
    isConnected: true,
    trackedAccountId: null,
    rank: 1,
    previousRank: 1,
    rankChange: 0,
    interactions:
      (account.likes ?? 0) + (account.replies ?? 0) + (account.reposts ?? 0),
    posts: account.trackedPosts ?? 0,
  })),
};
