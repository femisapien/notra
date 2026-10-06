import type {
  GeoTrafficPoint,
  WebAnalyticsPoint,
  WebAnalyticsResponse,
} from "@notra/geo-core/types/geo";
import {
  trafficDayKey,
  trafficSparklineDays,
} from "@notra/geo-core/utils/ai-traffic";
import { formatDayLabel } from "@notra/geo-core/utils/day-label";
import { trafficLogHostFilter } from "@notra/geo-core/utils/geo-project-domains";

import {
  WEB_TREND_AGENTS_KEY,
  WEB_TREND_PEOPLE_KEY,
} from "@/constants/web-analytics";
import type { WebTrendRow } from "@/types/geo";

/** People per day next to AI agents (crawlers) per day, on one day axis. */
export function buildWebTrendRows(
  webPoints: readonly WebAnalyticsPoint[],
  aiPoints: readonly GeoTrafficPoint[],
  locale: string,
  from?: string,
  to?: string
): WebTrendRow[] {
  const people = new Map<string, number>();
  for (const point of webPoints) {
    const day = trafficDayKey(point.day);
    people.set(day, (people.get(day) ?? 0) + point.views);
  }
  const agents = new Map<string, number>();
  for (const point of aiPoints) {
    if (point.visitorType !== "crawler") {
      continue;
    }
    const day = trafficDayKey(point.day);
    agents.set(day, (agents.get(day) ?? 0) + point.visits);
  }
  const days = trafficSparklineDays(
    [
      ...aiPoints,
      ...webPoints.map((point) => ({
        day: point.day,
        visitorType: "human" as const,
        source: "",
        visits: point.views,
      })),
    ],
    from,
    to
  );
  return days.map((day) => ({
    day: formatDayLabel(day, locale),
    rawDay: day,
    [WEB_TREND_PEOPLE_KEY]: people.get(day) ?? 0,
    [WEB_TREND_AGENTS_KEY]: agents.get(day) ?? 0,
  }));
}

/** Percent share of each side, or null when nothing was seen. */
export function webTrendShare(
  rows: readonly WebTrendRow[]
): { people: number; agents: number } | null {
  let people = 0;
  let agents = 0;
  for (const row of rows) {
    people += row[WEB_TREND_PEOPLE_KEY];
    agents += row[WEB_TREND_AGENTS_KEY];
  }
  const total = people + agents;
  if (total === 0) {
    return null;
  }
  const peopleShare = (people / total) * 100;
  return { people: peopleShare, agents: 100 - peopleShare };
}

/** Whole percent, but never "0" or "100" for a side that is there. */
export function formatWebShare(share: number): string {
  if (share > 0 && share < 1) {
    return "<1";
  }
  if (share > 99 && share < 100) {
    return ">99";
  }
  return String(Math.round(share));
}

/** Bare hostnames that saw people, for the domain selector. */
export function webHostsForSelect(
  web: WebAnalyticsResponse | undefined
): string[] {
  const hosts = new Set<string>();
  for (const row of web?.hosts ?? []) {
    const host = trafficLogHostFilter(row.host);
    if (host.length > 0) {
      hosts.add(host);
    }
  }
  return [...hosts];
}

/**
 * People data exists or is being collected, so the visitors view is worth
 * showing. Narrowed to one domain, only when that domain has seen people:
 * an AI-only domain keeps the AI view instead of a row of zeros.
 */
export function hasWebAnalytics(
  web: WebAnalyticsResponse | undefined,
  host = ""
): boolean {
  if (!web) {
    return false;
  }
  if (web.totals.views > 0) {
    return true;
  }
  const selected = trafficLogHostFilter(host);
  if (selected.length > 0) {
    return webHostsForSelect(web).includes(selected);
  }
  return web.tracking;
}
