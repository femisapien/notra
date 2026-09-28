import { describe, expect, test } from "bun:test";

import { DEMO_CONTENT_METRICS, DEMO_POSTS } from "@/constants/demo/content";
import { DEMO_OVERVIEW, DEMO_TIMESERIES } from "@/constants/demo/geo";
import { DEMO_SHELF } from "@/constants/demo/opportunities";
import {
  DEMO_TRAFFIC,
  DEMO_TRAFFIC_PAGES,
  DEMO_SENTIMENT,
  DEMO_JOURNEYS,
  DEMO_JOURNEY_EVENTS,
} from "@/constants/demo/traffic";
import { readDemoShelf } from "@/lib/demo/shelf";

describe("coherent demo workspace", () => {
  test("overview and sentiment totals agree with chart points", () => {
    for (const overview of DEMO_OVERVIEW) {
      const points = DEMO_TIMESERIES.filter(
        (point) => point.engine === overview.engine
      );
      expect(overview.checks).toBe(
        points.reduce((sum, p) => sum + p.checks, 0)
      );
      expect(overview.mentions).toBe(
        points.reduce((sum, p) => sum + p.mentions, 0)
      );
      expect(overview.visibility).toBe(
        points.reduce((sum, p) => sum + (p.visibility ?? 0), 0)
      );
      expect(overview.citations).toBe(
        points.reduce((sum, p) => sum + (p.citations ?? 0), 0)
      );
    }
    expect(DEMO_SENTIMENT.summary.mentions).toBe(
      DEMO_OVERVIEW.reduce((sum, p) => sum + p.mentions, 0)
    );
    expect(
      DEMO_SENTIMENT.summary.positive +
        DEMO_SENTIMENT.summary.neutral +
        DEMO_SENTIMENT.summary.negative
    ).toBe(DEMO_SENTIMENT.summary.mentions);
    expect(DEMO_SENTIMENT.points.reduce((sum, p) => sum + p.mentions, 0)).toBe(
      DEMO_SENTIMENT.summary.mentions
    );
  });
  test("traffic totals reconcile across sources, pages and the timeline", () => {
    for (const source of DEMO_TRAFFIC.sources) {
      expect(source.visits).toBe(
        DEMO_TRAFFIC.points
          .filter((p) => p.source === source.source)
          .reduce((sum, p) => sum + p.visits, 0)
      );
      expect(source.visits).toBe(
        DEMO_TRAFFIC_PAGES.pages
          .filter((p) => p.source === source.source)
          .reduce((sum, p) => sum + p.visits, 0)
      );
    }
    expect(DEMO_TRAFFIC.totals.crawler + DEMO_TRAFFIC.totals.aiReferral).toBe(
      DEMO_TRAFFIC.sources.reduce((sum, p) => sum + p.visits, 0)
    );
    for (const journey of DEMO_JOURNEYS.journeys) {
      expect(DEMO_JOURNEY_EVENTS[journey.journeyId]?.events.length).toBe(
        journey.pages
      );
    }
  });
  test("the content activity card reflects the actual sample posts", () => {
    expect(DEMO_CONTENT_METRICS.drafts).toBe(
      DEMO_POSTS.filter((p) => p.status === "draft").length
    );
    expect(DEMO_CONTENT_METRICS.published).toBe(
      DEMO_POSTS.filter((p) => p.status === "published").length
    );
    expect(
      DEMO_CONTENT_METRICS.graph.activity.reduce((sum, p) => sum + p.count, 0)
    ).toBe(DEMO_POSTS.length);
  });
  test("shelf filters and board counts use the displayed sources", () => {
    const open = readDemoShelf({ ticket: "open" });
    expect(open.sources.length).toBeGreaterThan(0);
    expect(
      open.sources.every((source) => source.opportunity?.status === "open")
    ).toBe(true);
    expect(open.boardCounts.open).toBe(open.sources.length);
    const searched = readDemoShelf({ search: "branching" });
    expect(searched.sources.map((source) => source.id).sort()).toEqual([
      "demo-shelf-0",
      "demo-shelf-3",
    ]);
    expect(searched.filteredCount).toBe(2);
    expect(searched.totalCount).toBe(DEMO_SHELF.sources.length);
    expect(readDemoShelf({ search: "no-such-source" }).sources).toHaveLength(0);
  });
});
