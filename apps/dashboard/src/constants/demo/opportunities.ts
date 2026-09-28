import { trackedPromptScanId } from "@notra/geo-core/geo/prompts";
import type { AgentReadinessResponse } from "@notra/geo-core/types/agent-readiness";
import type {
  GeoChangesResponse,
  GeoContentGapsResponse,
} from "@notra/geo-core/types/geo";
import type {
  GeoPersona,
  GeoPersonaActivityResponse,
} from "@notra/geo-core/types/geo-personas";

import {
  DEMO_COMPETITORS,
  DEMO_ENGINES,
  DEMO_PROMPTS,
  DEMO_RESULTS,
} from "@/constants/demo/geo";
import type { GeoShelfListResponse, GeoShelfMember } from "@/types/geo-shelf";

export const DEMO_PERSONAS: GeoPersona[] = [
  {
    name: "Alex Morgan",
    role: "Staff engineer",
    company: "B2B SaaS · 25 engineers",
    summary:
      "Owns the developer platform and wants every pull request to have an isolated database without maintaining extra infrastructure.",
    searchStyle:
      "Starts with architecture comparisons, then asks for a concrete Next.js implementation.",
    profile: {
      goals: ["Isolate preview deployments", "Reduce CI database setup time"],
      painPoints: [
        "Shared staging data causes flaky tests",
        "Schema changes block parallel development",
      ],
      currentStack: ["Next.js", "Vercel", "Postgres", "GitHub Actions"],
      buyingTriggers: ["Moving to trunk-based development"],
      objections: ["Migration effort", "Connection pooling under load"],
    },
    conversationPrompts: [
      "How should we isolate Postgres for each pull request?",
      "Show me how Neon branching works with Vercel previews.",
    ],
  },
  {
    name: "Sam Chen",
    role: "Technical founder",
    company: "Early-stage AI startup · 6 people",
    summary:
      "Building an AI product with a small team. Needs familiar SQL, predictable costs and a database that stays out of the way.",
    searchStyle:
      "Compares total cost and operational effort before testing a minimal integration.",
    profile: {
      goals: [
        "Ship a working product quickly",
        "Keep infrastructure costs predictable",
      ],
      painPoints: [
        "Paying for idle staging databases",
        "Limited time for operations",
      ],
      currentStack: ["TypeScript", "Drizzle", "Postgres"],
      buyingTriggers: ["Launching a paid beta"],
      objections: ["Cold-start latency", "Vendor lock-in"],
    },
    conversationPrompts: [
      "Which Postgres provider is a good fit for a small AI startup?",
      "How does scale to zero affect the first request?",
    ],
  },
  {
    name: "Jordan Ellis",
    role: "Platform lead",
    company: "Growth-stage marketplace · 80 engineers",
    summary:
      "Evaluating managed Postgres options for a growing engineering team, with an emphasis on recovery, access controls and safe migrations.",
    searchStyle:
      "Asks for operational tradeoffs and failure scenarios before making a shortlist.",
    profile: {
      goals: [
        "Make schema migrations safer",
        "Standardize development environments",
      ],
      painPoints: [
        "Slow database provisioning",
        "Manual refreshes of test data",
      ],
      currentStack: ["AWS", "Terraform", "Postgres", "Python"],
      buyingTriggers: ["Rebuilding the internal developer platform"],
      objections: ["Regional availability", "Recovery guarantees"],
    },
    conversationPrompts: [
      "Compare managed Postgres options for a growing engineering team.",
      "How can we test a production migration safely?",
    ],
  },
].map((persona, index) => ({
  ...persona,
  id: `demo-persona-${index}`,
  enabled: true,
  archivedAt: null,
  createdAt: "2026-09-04T10:00:00Z",
  updatedAt: "2026-09-26T09:00:00Z",
  memories: [
    {
      id: `demo-memory-${index}-0`,
      kind: "preference",
      content: persona.profile.goals[0] ?? "Prefer a practical implementation.",
    },
    {
      id: `demo-memory-${index}-1`,
      kind: "constraint",
      content:
        persona.profile.objections[0] ?? "Keep operational work manageable.",
    },
  ],
}));
export const DEMO_PERSONA_ACTIVITY: GeoPersonaActivityResponse = {
  from: "2026-09-01",
  to: "2026-09-28",
  points: DEMO_PERSONAS.flatMap((persona, personaIndex) =>
    Array.from({ length: 24 }, (_, index) => ({
      personaId: persona.id,
      snapshotVersion: "demo-v1",
      day: `2026-09-${String(index + 5).padStart(2, "0")}`,
      lastCheckedAt: `2026-09-${String(index + 5).padStart(2, "0")}T09:00:00Z`,
      checks: 8,
      mentions: Math.min(8, 3 + personaIndex + (index % 4)),
    }))
  ),
};
export const DEMO_GAPS: GeoContentGapsResponse = {
  hasScanData: true,
  promptGaps: DEMO_PROMPTS.filter((_, index) =>
    [0, 2, 3, 4].includes(index)
  ).map((prompt, index) => ({
    id: prompt.id,
    prompt: prompt.prompt,
    title:
      [
        "Postgres for Next.js: a practical decision guide",
        "Neon vs. Supabase: choose by workload",
        "Give coding agents an isolated database",
        "Reduce idle development database costs",
      ][index] ?? prompt.prompt,
    engines: DEMO_RESULTS.filter(
      (result) =>
        result.promptId === trackedPromptScanId(prompt) && !result.mentioned
    ).map((result) => result.engine),
    mentionedEngines: DEMO_RESULTS.filter(
      (result) =>
        result.promptId === trackedPromptScanId(prompt) && result.mentioned
    ).map((result) => result.engine),
    competitors: ["Supabase", "Amazon RDS"],
    discoveredCompetitors: [],
    searchQueries: [prompt.prompt],
    ownMentionRate:
      DEMO_RESULTS.filter(
        (result) =>
          result.promptId === trackedPromptScanId(prompt) && result.mentioned
      ).length / DEMO_ENGINES.length,
    engineCoverage: 1,
    opportunity: 0.88 - index * 0.12,
    won: false,
    brief: null,
  })),
  searchGaps: [
    "postgres connection pooling nextjs",
    "database branching ci pipeline",
    "postgres migration rehearsal",
  ].map((query, index) => ({
    id: `demo-gsc-gap-${index}`,
    prompt: `How do I implement ${query}?`,
    title:
      [
        "Connection pooling for Next.js",
        "Database branching in CI",
        "Rehearse your Postgres migration",
      ][index] ?? query,
    impressions: 4200 - index * 970,
    clicks: 83 - index * 19,
    position: 8.4 + index * 2.1,
    queries: [
      {
        query,
        impressions: 4200 - index * 970,
        clicks: 83 - index * 19,
        position: 8.4 + index * 2.1,
      },
    ],
    brief: null,
    recommendation: {
      action: index === 0 ? "update" : "create",
      reason:
        index === 0
          ? "Existing coverage could use a complete serverless connection example."
          : "Search demand is present but the sample content library has no dedicated walkthrough.",
      targets: [],
    },
  })),
  aiSearchGaps: [
    "postgres database branching for CI",
    "serverless postgres cold start",
    "neon supabase comparison",
  ].map((query, index) => ({
    id: `demo-search-gap-${index}`,
    query,
    variants: [query],
    prompts: [DEMO_PROMPTS[index]?.prompt ?? query],
    engines: DEMO_ENGINES,
    searches: 38 - index * 7,
    ownMentionRate: 0.25,
    competitors: ["Supabase"],
    discoveredCompetitors: [],
    opportunity: 0.82 - index * 0.11,
    brief: null,
  })),
};
export const DEMO_SHELF_MEMBERS: GeoShelfMember[] = [
  {
    id: "demo-member-jamie",
    userId: "public-demo-user",
    name: "Jamie",
    email: "demo@example.com",
    image: null,
    role: "admin",
  },
  {
    id: "demo-member-taylor",
    userId: "demo-user-taylor",
    name: "Taylor",
    email: "editor@example.com",
    image: null,
    role: "member",
  },
];
export const DEMO_SHELF: GeoShelfListResponse = {
  ownBrandName: "Neon",
  isSampleData: true,
  hasScanData: true,
  totalCount: 6,
  filteredCount: 6,
  nextOffset: null,
  boardCounts: {
    untracked: 2,
    open: 2,
    in_progress: 1,
    won: 1,
    lost: 0,
    dismissed: 0,
  },
  sources: [
    {
      title: "Postgres deployment guide",
      domain: "vercel.com",
      url: "https://vercel.com/docs",
      kind: "docs" as const,
    },
    {
      title: "Choosing a database for your next app",
      domain: "dev.to",
      url: "https://dev.to/t/postgresql",
      kind: "community" as const,
    },
    {
      title: "Managed PostgreSQL discussions",
      domain: "reddit.com",
      url: "https://www.reddit.com/r/PostgreSQL/",
      kind: "community" as const,
    },
    {
      title: "Database branching documentation",
      domain: "neon.com",
      url: "https://neon.com/docs/introduction/branching",
      kind: "docs" as const,
    },
    {
      title: "Postgres ecosystem resources",
      domain: "postgresql.org",
      url: "https://www.postgresql.org/support/",
      kind: "docs" as const,
    },
    {
      title: "Serverless database engineering",
      domain: "dev.to",
      url: "https://dev.to/t/serverless",
      kind: "community" as const,
    },
  ].map((source, index) => ({
    ...source,
    id: `demo-shelf-${index}`,
    ownership: index === 3 ? "own" : "third_party",
    origin: "scan",
    fetchStatus: "ok",
    lastFetchedAt: "2026-09-28T09:00:00Z",
    citations: {
      windowCount: 86 - index * 11,
      totalCount: 142 - index * 14,
      promptCount: 6 - (index % 4),
      engines: DEMO_ENGINES.slice(0, 4 - (index % 2)),
      firstCitedAt: "2026-09-03T09:00:00Z",
      lastCitedAt: "2026-09-28T09:00:00Z",
    },
    placements: [
      {
        competitorId: null,
        brandName: "Neon",
        brandDomain: "neon.com",
        status: index % 2 === 0 ? "absent" : "present",
        position: index % 2 === 0 ? null : 2,
        hasLink: index % 2 !== 0,
        evidence: "manual",
        excerpt:
          "Illustrative placement for this demo; not a claim about the linked page.",
        checkedAt: "2026-09-28T09:00:00Z",
      },
      ...DEMO_COMPETITORS.slice(0, index === 3 ? 0 : (index % 3) + 1).map(
        (competitor, competitorIndex) => ({
          competitorId: competitor.id,
          brandName: competitor.name,
          brandDomain: competitor.domain,
          status: "present" as const,
          position: competitorIndex + 1,
          hasLink: true,
          evidence: "manual" as const,
          excerpt: "Illustrative competitor placement for the demo.",
          checkedAt: "2026-09-28T09:00:00Z",
        })
      ),
    ],
    opportunity:
      index < 4
        ? {
            id: `demo-ticket-${index}`,
            status:
              (["open", "open", "in_progress", "won"] as const)[index] ??
              "open",
            priority: index < 2 ? "high" : "medium",
            assigneeMemberId:
              index % 2 === 0 ? "demo-member-jamie" : "demo-member-taylor",
            pocMemberId: null,
            notes:
              [
                "Prepare a concise branching walkthrough for the developer audience.",
                "Add a reproducible example with connection pooling.",
                "Review the community questions before drafting a response.",
                "Documentation reference is ready for editorial review.",
              ][index] ?? null,
            dueAt: "2026-10-02T09:00:00Z",
            createdByUserId: null,
            resolvedAt: index === 3 ? "2026-09-26T09:00:00Z" : null,
            createdAt: "2026-09-21T09:00:00Z",
            updatedAt: "2026-09-28T09:00:00Z",
          }
        : null,
    createdByUserId: null,
    createdAt: "2026-09-03T09:00:00Z",
    updatedAt: "2026-09-28T09:00:00Z",
  })),
};
export const DEMO_READINESS: AgentReadinessResponse = {
  targetUrl: "https://neon.com",
  scan: null,
  report: {
    id: "demo-readiness-4",
    status: "completed",
    targetUrl: "https://neon.com",
    score: 86,
    scoreLabel: "Two recommended checks remain",
    scoreBreakdown: {
      essential: { earned: 60, available: 60, passing: 6, total: 6 },
      recommended: { earned: 21, available: 35, passing: 3, total: 5 },
      bonus: { points: 5, positiveSignals: 1 },
    },
    eligibleChecks: 11,
    reportUrl: null,
    errorMessage: null,
    scannedAt: "2026-09-28T09:00:00Z",
    createdAt: "2026-09-28T08:55:00Z",
    issues: [
      {
        id: "demo-markdown",
        name: "Markdown discovery",
        tier: "recommended",
        result: "partial",
        details:
          "The example audit finds machine-readable documentation, with inconsistent discovery links on older pages.",
        recommendation:
          "Add a consistent markdown alternate link to the documentation template.",
      },
      {
        id: "demo-examples",
        name: "Executable API examples",
        tier: "recommended",
        result: "failed",
        details:
          "Some example API pages omit the expected error response shape in this sample audit.",
        recommendation:
          "Document common failure responses beside each request example.",
      },
    ],
  },
  history: [68, 74, 81, 86].map((score, index) => ({
    id: `demo-readiness-${index + 1}`,
    score,
    failedCount: index < 2 ? 3 - index : 1,
    partialCount: 1,
    scannedAt: `2026-09-${String(7 + index * 7).padStart(2, "0")}T09:00:00Z`,
  })),
};
export const DEMO_CHANGES: GeoChangesResponse = {
  previousScan: { id: "demo-scan-27", finishedAt: "2026-09-27T09:00:00Z" },
  currentScan: { id: "demo-scan-28", finishedAt: "2026-09-28T09:00:00Z" },
  summary: {
    gained: 2,
    lost: 1,
    positionImproved: 1,
    positionDropped: 0,
    citationsAdded: 0,
    citationsRemoved: 0,
  },
  events: [
    ...DEMO_RESULTS.filter((result) => result.mentioned).slice(0, 2),
    ...DEMO_RESULTS.filter((result) => !result.mentioned).slice(0, 1),
    ...DEMO_RESULTS.filter((result) => result.mentioned).slice(2, 3),
  ].map((result, index) => ({
    kind:
      (
        [
          "gained_mention",
          "gained_mention",
          "lost_mention",
          "position_improved",
        ] as const
      )[index] ?? "gained_mention",
    promptId: result.promptId,
    prompt: result.prompt,
    engine: result.engine,
    previous: {
      mentioned: index >= 2,
      position: index >= 2 ? (result.position ?? 2) + 2 : null,
    },
    current: { mentioned: result.mentioned, position: result.position },
    competitors: result.competitors,
    domains: ["neon.com"],
  })),
};
