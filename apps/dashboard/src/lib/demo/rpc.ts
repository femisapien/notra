import {
  GEO_MODEL_PROVIDERS,
  GEO_MODEL_CATALOG_SEED,
} from "@notra/geo-core/constants/geo-model-catalog";
import { ORPCError } from "@orpc/client";

import {
  DEMO_POSTS,
  DEMO_CONTENT_METRICS,
  DEMO_COLLECTIONS,
  DEMO_CONTENT,
  DEMO_PAGINATION,
} from "@/constants/demo/content";
import {
  DEMO_COMPETITORS,
  DEMO_COMPETITOR_SHARE,
  DEMO_COMPETITOR_POINTS,
  DEMO_GEO_SETTINGS,
  DEMO_OVERVIEW,
  DEMO_PROJECT,
  DEMO_PROMPTS,
  DEMO_RESULTS,
  DEMO_TIMESERIES,
} from "@/constants/demo/geo";
import {
  DEMO_IRIS,
  DEMO_IRIS_RUNS,
  DEMO_IRIS_SIGNALS,
} from "@/constants/demo/iris";
import {
  DEMO_SHELF_MEMBERS,
  DEMO_PERSONAS,
  DEMO_PERSONA_ACTIVITY,
  DEMO_GAPS,
  DEMO_READINESS,
  DEMO_CHANGES,
} from "@/constants/demo/opportunities";
import {
  DEMO_ANALYTICS,
  DEMO_LEADERBOARD,
  DEMO_ENGAGEMENT,
  DEMO_FOLLOWERS,
  DEMO_TOP_POSTS,
  DEMO_POSTING,
  DEMO_SCHEDULES,
  DEMO_INTEGRATIONS,
  DEMO_FEEDBACK,
  DEMO_GUIDELINES,
  DEMO_REFERENCES,
  DEMO_SKILLS,
} from "@/constants/demo/studio";
import {
  DEMO_TRAFFIC,
  DEMO_TRAFFIC_PAGES,
  DEMO_TRAFFIC_LOG,
  DEMO_SENTIMENT,
  DEMO_JOURNEYS,
  DEMO_JOURNEY_STATS,
  DEMO_JOURNEY_EVENTS,
} from "@/constants/demo/traffic";
import { DEMO_BRAND } from "@/constants/demo/workspace";
import { readDemoShelf } from "@/lib/demo/shelf";

/** Explicit allowlist: unknown procedures, including every mutation, fail locally. */
function readDemoRpc(path: readonly string[], input: unknown): unknown {
  const key = path.join(".");
  const args =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  switch (key) {
    case "content.list":
      return { posts: DEMO_POSTS, pagination: DEMO_PAGINATION };
    case "content.recents":
      return { posts: DEMO_POSTS.slice(0, 6) };
    case "content.home.get":
      return { posts: DEMO_POSTS };
    case "content.activeGenerations.list":
      return { generations: [], results: [] };
    case "content.collections.list":
      return { collections: DEMO_COLLECTIONS, pagination: DEMO_PAGINATION };
    case "content.collections.get": {
      const collection = DEMO_COLLECTIONS.find(
        (item) => item.id === args.collectionId
      );
      return {
        collection: collection
          ? {
              ...collection,
              posts: DEMO_POSTS.filter(
                (post) => post.id === collection.singlePost?.id
              ),
            }
          : null,
      };
    }
    case "content.get":
      return {
        content:
          DEMO_CONTENT.find((item) => item.id === args.contentId) ?? null,
        collection: null,
      };
    case "content.chatHistory.get":
      return { messages: [] };
    case "content.metrics.get":
      return DEMO_CONTENT_METRICS;
    case "integrations.list":
      return {
        integrations: DEMO_INTEGRATIONS,
        count: DEMO_INTEGRATIONS.length,
      };
    case "automation.schedules.list":
      return { triggers: DEMO_SCHEDULES };
    case "automation.events.list":
      return {
        triggers: [
          {
            ...DEMO_SCHEDULES[0],
            id: "demo-release-trigger",
            name: "Release notes to developer story",
            sourceType: "github_webhook",
            sourceConfig: { eventTypes: ["release.published"] },
          },
        ],
      };
    case "onboarding.suggestions":
      return [];
    case "geo.suggestionsList":
      return {
        suggestions: DEMO_GAPS.searchGaps.map((gap) => ({
          id: gap.id,
          prompt: gap.prompt,
          title: gap.title,
          source: "search_console",
          keywords: gap.queries,
          createdAt: "2026-09-27T06:00:00Z",
        })),
      };
    case "geo.searchConsoleKeywords":
      return {
        keywords: DEMO_GAPS.searchGaps.flatMap((gap) =>
          gap.queries.map((query) => ({
            ...query,
            ctr: query.clicks / query.impressions,
          }))
        ),
      };
    case "geo.searchConsoleStatus":
      return {
        configured: true,
        connected: true,
        email: "marketing@example.com",
        siteUrl: "sc-domain:neon.com",
        status: "active",
        lastSyncedAt: "2026-09-27T06:00:00Z",
        lastError: null,
        weeklySyncScheduled: true,
        sites: [],
      };
    case "geo.personasList":
      return { configured: true, personas: DEMO_PERSONAS };
    case "geo.personasActivity":
      return DEMO_PERSONA_ACTIVITY;
    case "geo.personaResults": {
      const persona = DEMO_PERSONAS.find((item) => item.id === args.personaId);
      return {
        selectedScanId: "demo-persona-scan",
        scans: [
          { id: "demo-persona-scan", capturedAt: "2026-09-28T09:00:00Z" },
        ],
        results: persona
          ? persona.conversationPrompts.map((prompt, index) => ({
              ...DEMO_RESULTS[index + 1],
              scanId: "demo-persona-scan",
              personaId: persona.id,
              personaSnapshot: null,
              turn: index + 1,
              prompt,
            }))
          : [],
      };
    }
    case "geo.personasGenerationStatus":
      return null;
    case "geo.writerGaps":
      return DEMO_GAPS;
    case "geo.writerBriefsList":
      return {
        briefs: DEMO_POSTS.filter((post) => post.contentType === "blog_post")
          .slice(0, 3)
          .map((post) => ({
            id: `demo-brief-${post.id}`,
            topic: post.title,
            workingTitle: post.title,
            status: "completed",
            postId: post.id,
            createdAt: post.createdAt,
          })),
      };
    case "geo.shelfMembers":
      return {
        members: DEMO_SHELF_MEMBERS,
        currentMemberId: "demo-member-jamie",
      };
    case "geo.shelfList":
      return readDemoShelf(args);
    case "geo.agentReadiness":
      return DEMO_READINESS;
    case "agentFeedback.list":
      return {
        items: DEMO_FEEDBACK.filter(
          (item) => !args.status || item.status === args.status
        ),
        nextCursor: null,
        counts: { new: 1, triaged: 1, resolved: 1, archived: 0 },
      };
    case "geo.settings":
      return { configured: true, settings: DEMO_GEO_SETTINGS };
    case "geo.projectsList":
      return { projects: [DEMO_PROJECT] };
    case "geo.promptsList":
      return { configured: true, prompts: DEMO_PROMPTS };
    case "geo.competitors":
      return { competitors: DEMO_COMPETITORS };
    case "geo.overview":
      return { configured: true, engines: DEMO_OVERVIEW };
    case "geo.timeseries":
      return { configured: true, points: DEMO_TIMESERIES };
    case "geo.promptResultSummaries":
      return {
        configured: true,
        results: DEMO_RESULTS.map((result, index) => ({
          ...result,
          checkId: `demo-check-${index}`,
        })),
      };
    case "geo.promptHistory":
      return {
        configured: true,
        promptId: args.promptId,
        checks: DEMO_RESULTS.flatMap((result, index) =>
          result.promptId === args.promptId
            ? [
                {
                  id: `demo-check-${index}`,
                  scanId: "demo-scan-28",
                  engine: result.engine,
                  mentioned: result.mentioned,
                  ownedSourceCited: result.ownedSourceCited,
                  position: result.position,
                  sentiment: result.sentiment,
                  competitors: result.competitors,
                  trend: DEMO_TIMESERIES.filter(
                    (point) => point.engine === DEMO_TIMESERIES[0]?.engine
                  ).map((point) => {
                    const rows = DEMO_TIMESERIES.filter(
                      (row) => row.day === point.day
                    );
                    return {
                      day: point.day,
                      value:
                        rows.reduce((sum, row) => sum + row.mentions, 0) /
                        rows.reduce((sum, row) => sum + row.checks, 0),
                    };
                  }),
                  language: "English",
                  capturedAt: result.lastCheckedAt,
                },
              ]
            : []
        ),
      };
    case "geo.competitorDetail": {
      const competitor = String(args.competitor ?? args.name ?? "Supabase");
      return {
        configured: true,
        points: DEMO_TIMESERIES.filter(
          (point) => point.engine === DEMO_OVERVIEW[0]?.engine
        ).map((point) => ({
          day: point.day,
          checks: point.checks * 4,
          mentions: Math.round(point.mentions * 2.5),
        })),
        prompts: DEMO_RESULTS.filter((result) =>
          result.competitors.includes(competitor)
        ).map((result) => ({
          promptId: result.promptId,
          prompt: result.prompt,
          engine: result.engine,
          capturedAt: result.lastCheckedAt,
          mentioned: result.mentioned,
          position: result.position,
        })),
      };
    }
    case "geo.sequenceResults":
      return {
        configured: true,
        results: DEMO_PERSONAS.slice(0, 2).flatMap((persona) =>
          persona.conversationPrompts.map((prompt, index) => ({
            ...DEMO_RESULTS[index + 1],
            sequenceId: `demo-sequence-${persona.id}`,
            turn: index + 1,
            prompt,
          }))
        ),
      };
    case "geo.promptResultDetail": {
      const checkId =
        input && typeof input === "object" && "checkId" in input
          ? String(input.checkId)
          : "";
      return {
        result:
          DEMO_RESULTS[Number(checkId.replace("demo-check-", ""))] ?? null,
      };
    }
    case "geo.competitorShare":
      return { ...DEMO_COMPETITOR_SHARE, points: DEMO_COMPETITOR_POINTS };
    case "geo.languageShare": {
      const checks = DEMO_OVERVIEW.reduce((sum, row) => sum + row.checks, 0);
      const mentions = DEMO_OVERVIEW.reduce(
        (sum, row) => sum + row.mentions,
        0
      );
      return {
        configured: true,
        points: [
          {
            trend: DEMO_TIMESERIES.filter(
              (point) => point.engine === DEMO_TIMESERIES[0]?.engine
            ).map((point) => {
              const rows = DEMO_TIMESERIES.filter(
                (row) => row.day === point.day
              );
              return {
                day: point.day,
                value:
                  rows.reduce((sum, row) => sum + row.mentions, 0) /
                  rows.reduce((sum, row) => sum + row.checks, 0),
              };
            }),
            language: "English",
            checks,
            mentions,
            mentionRate: mentions / checks,
            avgPosition:
              DEMO_OVERVIEW.reduce(
                (sum, row) => sum + (row.avgPosition ?? 0),
                0
              ) / DEMO_OVERVIEW.length,
          },
        ],
      };
    }
    case "geo.changes":
      return DEMO_CHANGES;
    case "geo.aiTraffic":
      return DEMO_TRAFFIC;
    case "geo.trafficPages":
      return DEMO_TRAFFIC_PAGES;
    case "geo.trafficLog":
      return DEMO_TRAFFIC_LOG;
    case "geo.journeyStats":
      return DEMO_JOURNEY_STATS;
    case "geo.journeyDetail":
      return (
        DEMO_JOURNEY_EVENTS[String(args.journeyId)] ?? {
          configured: true,
          events: [],
        }
      );
    case "geo.sentiment":
      return DEMO_SENTIMENT;
    case "geo.sentimentEvidence":
      return { items: [], nextCursor: null };
    case "geo.trafficJourneys":
      return DEMO_JOURNEYS;
    case "geo.sequencesList":
      return {
        sequences: DEMO_PERSONAS.slice(0, 2).map((persona) => ({
          id: `demo-sequence-${persona.id}`,
          name:
            persona.role === "Staff engineer"
              ? "Preview deployment evaluation"
              : "Startup database shortlist",
          steps: persona.conversationPrompts,
          enabled: true,
          createdAt: persona.createdAt,
        })),
      };
    case "geo.modelCatalog":
      return {
        providers: GEO_MODEL_PROVIDERS,
        models: GEO_MODEL_CATALOG_SEED.map((model) => ({
          ...model,
          supportsGroundedChecks: true,
        })),
      };
    case "geo.scanRuns":
      return { runs: [] };
    case "onboarding.agentRun":
      return { ran: true, running: false, startedAt: null };
    case "onboarding.get":
      return {
        hasBrandIdentity: true,
        hasIntegration: true,
        hasSchedule: true,
        hasGeoTracking: true,
        onboardingCompleted: true,
        onboardingDismissed: true,
      };
    case "brand.voices.list":
      return { voices: [DEMO_BRAND] };
    case "brand.guidelines.get":
      return DEMO_GUIDELINES;
    case "brand.references.list":
      return { references: DEMO_REFERENCES };
    case "brand.analysis.getProgress":
      return { progress: { status: "idle", currentStep: 0, totalSteps: 3 } };
    case "analytics.leaderboard":
      return { ...DEMO_LEADERBOARD, days: args.days === 7 ? 7 : 30 };
    case "analytics.overview":
      return DEMO_ANALYTICS;
    case "analytics.engagementTimeseries":
      return DEMO_ENGAGEMENT;
    case "analytics.followerGrowth":
      return DEMO_FOLLOWERS;
    case "analytics.postingPerformance":
      return DEMO_POSTING;
    case "analytics.topPosts":
      return DEMO_TOP_POSTS;
    case "analytics.adoption":
      return {
        configured: true,
        organizationCreatedAt: "2026-09-01T00:00:00Z",
        firstNotraPostAt:
          DEMO_POSTS.filter((post) => post.status === "published").at(-1)
            ?.createdAt ?? null,
        notraPosts: DEMO_CONTENT_METRICS.published,
      };
    case "skills.list":
      return DEMO_SKILLS;
    case "skills.getByName":
      return {
        ...DEMO_SKILLS.find((skill) => skill.name === args.name),
        content:
          "# Developer writing\n\nExplain the problem first. Use a reproducible example and describe the operational tradeoffs.",
      };
    case "apiKeys.list":
      return [];
    case "iris.getOverview":
      return DEMO_IRIS;
    case "iris.listRuns":
      return DEMO_IRIS_RUNS;
    case "iris.listSignals":
      return DEMO_IRIS_SIGNALS;
    case "notifications.list":
      return { notifications: [], unreadCount: 0 };
    default:
      throw new ORPCError("FORBIDDEN", {
        message:
          "This demo is read only. Create a workspace to use this action.",
      });
  }
}

export async function demoRpc(
  path: readonly string[],
  input: unknown
): Promise<unknown> {
  return structuredClone(readDemoRpc(path, input));
}
