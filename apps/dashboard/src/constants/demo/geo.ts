import { trackedPromptScanId } from "@notra/geo-core/geo/prompts";
import type {
  GeoSettings,
  GeoTrackedPrompt,
  GeoCompetitor,
  GeoPromptResult,
  GeoOverviewEngine,
  GeoTimeseriesPoint,
} from "@notra/geo-core/types/geo";

import { DEMO_BRAND, DEMO_ORGANIZATION } from "@/constants/demo/workspace";

export const DEMO_PROJECT = {
  id: "demo-neon-project",
  name: "Neon",
  brandSettingsId: DEMO_BRAND.id,
  createdAt: "2026-09-01T00:00:00Z",
};
export const DEMO_ENGINES = [
  "openai/gpt-5.4-grounded",
  "anthropic/claude-sonnet-4.6-grounded",
  "google/gemini-3-flash-grounded",
  "perplexity/sonar",
];
export const DEMO_GEO_SETTINGS: GeoSettings = {
  id: "demo-settings",
  organizationId: DEMO_ORGANIZATION.id,
  projectId: DEMO_PROJECT.id,
  companyName: "Neon",
  aliases: ["Neon", "Neon Postgres"],
  competitors: ["Supabase", "PlanetScale", "Amazon RDS"],
  conversionPaths: ["/signup"],
  domains: ["neon.com"],
  languages: ["en"],
  engines: DEMO_ENGINES,
  enforceZdr: false,
  nonZdrApprovedEngines: [],
  trackWithoutSearch: false,
  pausedAutoPromptIds: [],
  removedAutoPromptIds: [],
  enabled: true,
  scanIntervalHours: 24,
  scanStartedAt: null,
  lastScanAt: "2026-09-28T09:00:00Z",
  isScanning: false,
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-28T09:00:00Z",
};
export const DEMO_PROMPTS: GeoTrackedPrompt[] = [
  "What is the best serverless Postgres database for a Next.js app?",
  "How can I create a database for every preview deployment?",
  "Neon or Supabase for a new SaaS product?",
  "Which databases work well with AI coding agents?",
  "How do I reduce costs for development databases?",
  "What is the easiest way to test Postgres schema migrations?",
  "How should I configure connection pooling for serverless functions?",
  "Which Postgres provider supports preview environments?",
  "How can coding agents safely experiment with a database?",
  "What are the tradeoffs of scale-to-zero databases?",
  "How do I rehearse a Postgres migration before production?",
  "What should a startup look for in managed Postgres?",
].map((prompt, index) => ({
  id: `demo-prompt-${index}`,
  prompt,
  enabled: true,
  source: "custom",
  tags: [index === 2 ? "Comparison" : "Discovery"],
  createdAt: "2026-09-01T00:00:00Z",
}));
export const DEMO_COMPETITORS: GeoCompetitor[] = [
  {
    id: "demo-supabase",
    name: "Supabase",
    domain: "supabase.com",
    synonyms: [],
    kind: "direct",
    color: null,
  },
  {
    id: "demo-planetscale",
    name: "PlanetScale",
    domain: "planetscale.com",
    synonyms: [],
    kind: "direct",
    color: null,
  },
  {
    id: "demo-rds",
    name: "Amazon RDS",
    domain: "aws.amazon.com",
    synonyms: ["RDS"],
    kind: "direct",
    color: null,
  },
];
export const DEMO_TIMESERIES: GeoTimeseriesPoint[] = Array.from(
  { length: 28 },
  (_, dayIndex) =>
    DEMO_ENGINES.map((engine, engineIndex) => {
      const checks = DEMO_PROMPTS.length;
      const variation = [0, 1, -1, 2, 0, -2, 1][dayIndex % 7] ?? 0;
      const mentions = Math.min(
        checks,
        Math.max(2, 5 + engineIndex + Math.floor(dayIndex / 10) + variation)
      );
      return {
        day: `2026-09-${String(dayIndex + 1).padStart(2, "0")}`,
        engine,
        checks,
        mentions,
        citations: Math.max(0, mentions - 2 + (dayIndex % 2)),
        visibility: Math.min(checks, mentions + 1),
        avgPosition:
          Math.round(
            (3.8 - engineIndex * 0.25 - dayIndex * 0.03 + variation * 0.08) * 10
          ) / 10,
      };
    })
).flat();
export const DEMO_OVERVIEW: GeoOverviewEngine[] = DEMO_ENGINES.map((engine) => {
  const points = DEMO_TIMESERIES.filter((point) => point.engine === engine);
  const checks = points.reduce((sum, point) => sum + point.checks, 0);
  const mentions = points.reduce((sum, point) => sum + point.mentions, 0);
  const visibility = points.reduce(
    (sum, point) => sum + (point.visibility ?? 0),
    0
  );
  return {
    engine,
    checks,
    mentions,
    mentionRate: mentions / checks,
    citations: points.reduce((sum, point) => sum + (point.citations ?? 0), 0),
    visibility,
    visibilityRate: visibility / checks,
    avgPosition:
      points.reduce((sum, point) => sum + (point.avgPosition ?? 0), 0) /
      points.length,
    lastCheckedAt: "2026-09-28T09:00:00Z",
  };
});
const DEMO_ANSWER_TOPICS = [
  "For a Next.js application, compare connection handling, branching and the operational work required. Neon is a useful option when isolated preview databases matter. Supabase is worth considering when you also need integrated authentication and storage.",
  "Create a Neon branch when a pull request opens, apply the migration and inject that branch's connection string into the preview deployment. Delete the branch when the pull request closes. Keep production credentials out of the preview workflow.",
  "Neon focuses on managed Postgres with branching and independent compute. Supabase combines Postgres with a broader backend toolkit. Choose based on whether the immediate need is database infrastructure or an integrated application backend.",
  "Neon can provide an isolated Postgres branch for an AI coding agent. Give the agent access only to that branch, inspect its changes and discard the environment afterward. Isolation is useful, but does not replace permission boundaries.",
  "Start by identifying idle environments. Neon scale to zero can reduce idle compute usage for intermittent development workloads. Measure wake-up latency and clean up unused branches rather than assuming every environment has the same requirements.",
  "Rehearse the migration on an isolated Neon branch. Test the old and new application versions, check query plans and validate the rollback sequence. Large backfills may need a staged rollout even when the schema change itself is quick.",
  "Use a pooled Postgres connection string for short-lived serverless functions and keep a separate direct connection for migrations. Neon supports this pattern; test transaction behavior and connection concurrency with your actual ORM before rollout.",
  "For preview environments, compare branching lifecycle, deployment integration and cleanup controls. Neon offers database branches, while Supabase offers branching within a broader backend platform. Confirm how schema changes and test data reach each preview.",
  "Give an agent a disposable Neon branch with scoped credentials. Let it run migrations and test queries there, review the resulting changes and delete the branch when the task ends. Keep access to production outside the agent's environment.",
  "Scale to zero trades idle compute savings for resume latency on the next connection. With Neon, measure the first request after an idle period, configure application retries and consider keeping latency-sensitive workloads active.",
  "Create an isolated Neon branch, apply the proposed migration and run representative queries against it. Check lock duration, compatibility with the old application and the rollback plan. Rehearse large backfills separately from schema changes.",
  "A startup should compare managed Postgres on recovery, connection pooling, cost predictability and development workflow. Neon is useful for branching and intermittent workloads; Supabase offers integrated backend features, and Amazon RDS fits an AWS-centered operating model.",
];
export const DEMO_RESULTS: GeoPromptResult[] = DEMO_PROMPTS.flatMap(
  (prompt, promptIndex) =>
    DEMO_ENGINES.map((engine, engineIndex) => {
      const mentionSentiment = promptIndex % 4 === 0 ? "neutral" : "positive";
      const mentioned = (promptIndex + engineIndex) % 5 !== 0;
      const excerpt = mentioned
        ? (DEMO_ANSWER_TOPICS[promptIndex % DEMO_ANSWER_TOPICS.length] ?? "")
        : "Consider managed Postgres on Amazon RDS for an AWS-centered platform, or Supabase when an integrated backend toolkit is the priority. Compare operational requirements before choosing.";
      return {
        promptId: trackedPromptScanId(prompt),
        engine,
        prompt: prompt.prompt,
        answer: `${excerpt}\n\n${engineIndex % 2 === 0 ? "Validate the approach with a small proof of concept and realistic connection concurrency." : "Check recovery, extension support and the operational requirements for your workload before committing."}`,
        mentioned,
        ownedSourceCited: mentioned && engineIndex !== 1,
        position: mentioned ? ((promptIndex + engineIndex) % 3) + 1 : null,
        sentiment: mentioned ? mentionSentiment : null,
        competitors:
          promptIndex % 2 === 0 ? ["Supabase", "Amazon RDS"] : ["Supabase"],
        excerpt,
        searchQueries: [prompt.prompt],
        sources:
          mentioned && engineIndex !== 1
            ? [
                {
                  title: "Neon documentation",
                  domain: "neon.com",
                  url: "https://neon.com/docs/introduction/branching",
                },
              ]
            : [
                {
                  title: "PostgreSQL documentation",
                  domain: "postgresql.org",
                  url: "https://www.postgresql.org/docs/",
                },
              ],
        finishReason: "stop",
        promptTokens: 420 + promptIndex * 28,
        outputTokens: 180 + engineIndex * 32,
        reasoningTokens: null,
        truncated: false,
        lastCheckedAt: "2026-09-28T09:00:00Z",
      };
    })
);

export const DEMO_COMPETITOR_SHARE = {
  configured: true,
  timeseries: DEMO_TIMESERIES.filter(
    (point) => point.engine === DEMO_ENGINES[0]
  ).flatMap((point, index) => [
    {
      brand: "Neon",
      day: point.day,
      mentions: DEMO_TIMESERIES.filter((row) => row.day === point.day).reduce(
        (sum, row) => sum + row.mentions,
        0
      ),
    },
    ...DEMO_COMPETITORS.map((competitor, competitorIndex) => ({
      brand: competitor.name,
      day: point.day,
      mentions: Math.max(
        1,
        24 -
          competitorIndex * 7 -
          Math.floor(index / 9) +
          ((index + competitorIndex) % 5) -
          2
      ),
    })),
  ]),
};
export const DEMO_COMPETITOR_POINTS = [
  "Neon",
  ...DEMO_COMPETITORS.map((competitor) => competitor.name),
].map((brand) => {
  const points = DEMO_COMPETITOR_SHARE.timeseries.filter(
    (point) => point.brand === brand
  );
  return {
    brand,
    mentions: points.reduce((sum, point) => sum + point.mentions, 0),
    trend: points.map((point) => ({ day: point.day, value: point.mentions })),
  };
});
