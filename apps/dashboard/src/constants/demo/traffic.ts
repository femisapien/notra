import type {
  AiTrafficResponse,
  GeoTrafficPagesResponse,
  GeoTrafficLogResponse,
  GeoTrafficJourneysResponse,
  GeoJourneyStatsResponse,
  GeoJourneyDetailResponse,
} from "@notra/geo-core/types/geo";
import type { GeoSentimentResponse } from "@notra/geo-core/types/geo-sentiment";
import {
  summarizeSentiment,
  sentimentPoints,
} from "@notra/geo-core/utils/geo-sentiment";

import { DEMO_ENGINES, DEMO_TIMESERIES } from "@/constants/demo/geo";

const DEMO_TRAFFIC_SOURCES = [
  {
    source: "ChatGPT",
    visitorType: "ai_referral",
    agent: "ChatGPT-User",
    category: "assistant-browse",
  },
  {
    source: "Perplexity",
    visitorType: "ai_referral",
    agent: "Perplexity-User",
    category: "assistant-browse",
  },
  {
    source: "GPTBot",
    visitorType: "crawler",
    agent: "GPTBot",
    category: "training-crawler",
  },
  {
    source: "ClaudeBot",
    visitorType: "crawler",
    agent: "ClaudeBot",
    category: "training-crawler",
  },
] as const;
const DEMO_TRAFFIC_POINTS = Array.from({ length: 28 }, (_, day) =>
  DEMO_TRAFFIC_SOURCES.map((source, index) => ({
    day: `2026-09-${String(day + 1).padStart(2, "0")}`,
    source: source.source,
    visitorType: source.visitorType,
    visits: Math.max(
      2,
      (index < 2 ? 9 : 32) +
        Math.floor(day * 0.6) +
        ([2, -3, 5, 0, 7, -2, 1][day % 7] ?? 0) +
        index * 3
    ),
  }))
).flat();
export const DEMO_TRAFFIC: AiTrafficResponse = {
  configured: true,
  totals: {
    crawler: DEMO_TRAFFIC_POINTS.filter(
      (p) => p.visitorType === "crawler"
    ).reduce((sum, p) => sum + p.visits, 0),
    aiReferral: DEMO_TRAFFIC_POINTS.filter(
      (p) => p.visitorType === "ai_referral"
    ).reduce((sum, p) => sum + p.visits, 0),
    cited: DEMO_TIMESERIES.reduce((sum, p) => sum + (p.citations ?? 0), 0),
    conversions: 42,
  },
  previousConversions: 31,
  sources: DEMO_TRAFFIC_SOURCES.map((source) => {
    const visits = DEMO_TRAFFIC_POINTS.filter(
      (p) => p.source === source.source
    ).reduce((sum, p) => sum + p.visits, 0);
    return {
      ...source,
      confidence: "high",
      visits,
      previousVisits: Math.round(visits * 0.78),
      markdownVisits:
        source.visitorType === "crawler" ? Math.round(visits * 0.18) : 0,
      paths: 4,
      lastSeenAt: "2026-09-28T09:00:00Z",
    };
  }),
  points: DEMO_TRAFFIC_POINTS,
};
export const DEMO_TRAFFIC_PAGES: GeoTrafficPagesResponse = {
  configured: true,
  pages: DEMO_TRAFFIC.sources.flatMap((source) =>
    [
      "/docs/introduction/branching",
      "/docs/introduction/autoscaling",
      "/pricing",
      "/docs/connect/connect-from-any-app",
    ].map((path, index) => ({
      host: "neon.com",
      path,
      source: source.source,
      visitorType: source.visitorType,
      visits:
        Math.floor(source.visits / 4) + (index < source.visits % 4 ? 1 : 0),
      previousVisits: Math.floor((source.previousVisits ?? 0) / 4),
      lastSeenAt: "2026-09-28T09:00:00Z",
    }))
  ),
};
export const DEMO_JOURNEYS: GeoTrafficJourneysResponse = {
  configured: true,
  journeys: Array.from({ length: 16 }, (_, index) => {
    const source = DEMO_TRAFFIC_SOURCES[index % 4] ?? DEMO_TRAFFIC_SOURCES[0];
    return {
      journeyId: `demo-journey-${index}`,
      source: source.source,
      visitorType: source.visitorType,
      pages: 2 + (index % 3),
      distinctPaths: 2 + (index % 3),
      firstSeenAt: `2026-09-28T${String(9 - Math.floor(index / 4)).padStart(2, "0")}:00:00Z`,
      lastSeenAt: `2026-09-28T${String(9 - Math.floor(index / 4)).padStart(2, "0")}:03:00Z`,
      entryPath: "/docs/introduction/branching",
      samplePaths: [
        "/docs/introduction/branching",
        "/docs/introduction/autoscaling",
        "/pricing",
        "/signup",
      ].slice(0, 2 + (index % 3)),
    };
  }),
};
export const DEMO_JOURNEY_EVENTS: Record<string, GeoJourneyDetailResponse> =
  Object.fromEntries(
    DEMO_JOURNEYS.journeys.map((journey) => [
      journey.journeyId,
      {
        configured: true,
        events: journey.samplePaths.map((path, index) => ({
          capturedAt: journey.firstSeenAt.replace(":00:00Z", `:0${index}:00Z`),
          path,
          host: "neon.com",
          method: "GET",
          referer:
            index === 0
              ? ""
              : `https://neon.com${journey.samplePaths[index - 1]}`,
          country: "US",
          agent: journey.source,
          category:
            journey.visitorType === "crawler"
              ? "training-crawler"
              : "assistant-browse",
        })),
      },
    ])
  );
export const DEMO_JOURNEY_STATS: GeoJourneyStatsResponse = {
  configured: true,
  totalPages: 4,
  previousTotalPages: 3,
  sources: DEMO_TRAFFIC_SOURCES.map((source) => {
    const journeys = DEMO_JOURNEYS.journeys.filter(
      (j) => j.source === source.source
    );
    return {
      source: source.source,
      visitorType: source.visitorType,
      journeys: journeys.length,
      previousJourneys: 3,
      pages: journeys.reduce((sum, j) => sum + j.pages, 0),
      singleFetch: 0,
      deepCrawls: journeys.filter((j) => j.pages >= 3).length,
      lastSeenAt: "2026-09-28T09:03:00Z",
      daily: [{ day: "2026-09-28", journeys: journeys.length }],
    };
  }),
  pages: [
    "/docs/introduction/branching",
    "/docs/introduction/autoscaling",
    "/pricing",
    "/signup",
  ].map((path) => {
    const count = DEMO_JOURNEYS.journeys.filter((j) =>
      j.samplePaths.includes(path)
    ).length;
    return {
      path,
      journeys: count,
      previousJourneys: Math.max(0, count - 3),
      entries: path === "/docs/introduction/branching" ? 16 : 0,
      lastSeenAt: "2026-09-28T09:03:00Z",
      daily: [{ day: "2026-09-28", journeys: count }],
    };
  }),
};
export const DEMO_TRAFFIC_LOG: GeoTrafficLogResponse = {
  configured: true,
  total: DEMO_JOURNEYS.journeys.reduce((sum, j) => sum + j.pages, 0),
  log: DEMO_JOURNEYS.journeys
    .flatMap((journey) =>
      (DEMO_JOURNEY_EVENTS[journey.journeyId]?.events ?? []).map((event) => ({
        ...event,
        visitorType: journey.visitorType,
        source: journey.source,
        confidence: "high",
        ua: journey.source,
        journeyId: journey.journeyId,
        wantsMarkdown: journey.visitorType === "crawler",
      }))
    )
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)),
};
const DEMO_SENTIMENT_ROWS = DEMO_TIMESERIES.map((point, index) => {
  const negative = index % 11 === 0 ? 1 : 0;
  const neutral = Math.floor(point.mentions * 0.25);
  return {
    engine: point.engine,
    day: point.day,
    totalChecks: point.checks,
    mentions: point.mentions,
    positive: point.mentions - neutral - negative,
    neutral,
    negative,
    lastCheckedAt: `${point.day}T09:00:00Z`,
  };
});
export const DEMO_SENTIMENT: GeoSentimentResponse = {
  configured: true,
  summary: summarizeSentiment(DEMO_SENTIMENT_ROWS),
  engines: DEMO_ENGINES.map((engine) => ({
    ...summarizeSentiment(
      DEMO_SENTIMENT_ROWS.filter((row) => row.engine === engine)
    ),
    engine,
  })),
  points: sentimentPoints(DEMO_SENTIMENT_ROWS),
};
