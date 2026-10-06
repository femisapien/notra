"use client";

import { GEO_EMPTY_TRAFFIC_RESPONSE } from "@notra/geo-core/constants/geo";
import type { WebAnalyticsSource } from "@notra/geo-core/types/geo";
import {
  formatGeoSource,
  toGeoTrafficPreviousTotals,
  trafficVisitDelta,
} from "@notra/geo-core/utils/ai-traffic";
import { todayIsoDate } from "@notra/geo-core/utils/day-label";
import { AnimatedNumber } from "@notra/ui/components/animated-number";
import { TruncateWithTooltip } from "@notra/ui/components/shared/truncate-with-tooltip";
import { useLocale, useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { EChartsAreaChart } from "@/components/evilcharts/charts/echarts-area-chart";
import { EngineIcon } from "@/components/geo/engine-icon";
import { GeoStatDelta } from "@/components/geo/geo-stat-delta";
import { CountryFlag } from "@/components/geo/twemoji";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import { CHART_PRIMARY_COLOR, CHART_SECONDARY_COLOR } from "@/constants/charts";
import {
  TRAFFIC_HERO_CHART_SURFACE_CLASS,
  TRAFFIC_HERO_FRAME_CLASS,
  TRAFFIC_HERO_METRIC_CELL_CLASS,
  TRAFFIC_HERO_METRIC_VALUE_CLASS,
  TRAFFIC_HERO_METRICS_GRID_CLASS,
  TRAFFIC_HERO_METRICS_SURFACE_CLASS,
} from "@/constants/geo-traffic-hero";
import {
  WEB_LIST_LIMIT,
  WEB_TREND_AGENTS_KEY,
  WEB_TREND_PEOPLE_KEY,
} from "@/constants/web-analytics";
import type { ChartConfig } from "@/types/charts";
import type {
  WebBarListProps,
  WebBarListRow,
  WebVisitorsSectionProps,
} from "@/types/geo";
import { formatFullDayLabel } from "@/utils/analytics-charts";
import { seriesColors } from "@/utils/chart-colors";
import { countryName } from "@/utils/country";
import { formatChartInteger } from "@/utils/geo-charts";
import {
  buildWebTrendRows,
  formatWebShare,
  webTrendShare,
} from "@/utils/web-analytics";

const CHART_OPTIONS = {
  grid: { left: 4, right: 8, top: 8, bottom: 4, containLabel: true },
};
const TREND_STROKE_WIDTH = 1.5;
const PERCENT = 100;

function webSourceName(
  source: WebAnalyticsSource,
  directLabel: string
): string {
  if (source.group === "direct") {
    return directLabel;
  }
  return source.group === "ai" ? formatGeoSource(source.source) : source.source;
}

function WebMetric({
  label,
  value,
  previous,
}: {
  label: string;
  value: number;
  previous: number;
}) {
  const tShared = useTranslations("geo.shared");
  return (
    <div className={TRAFFIC_HERO_METRIC_CELL_CLASS}>
      <p className="text-foreground/75 text-sm leading-5 font-semibold tracking-tight">
        {label}
      </p>
      <div className="flex max-w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-2 self-start">
        <AnimatedNumber
          className={TRAFFIC_HERO_METRIC_VALUE_CLASS}
          value={value}
        />
        <GeoStatDelta
          delta={trafficVisitDelta(value, previous)}
          hint={tShared("vsPreviousPeriodOfThe")}
          label={label}
        />
      </div>
    </div>
  );
}

function WebBarList({ rows, emptyMessage, valueLabel }: WebBarListProps) {
  const locale = useLocale();
  if (rows.length === 0) {
    return (
      <InstrumentEmpty
        className="min-h-40"
        message={emptyMessage}
        seed={valueLabel}
      />
    );
  }
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <ul aria-label={valueLabel} className="flex flex-col gap-1">
      {rows.map((row) => (
        <li
          className="relative flex h-8 min-w-0 items-center gap-3 overflow-hidden rounded-lg px-2.5 text-sm"
          key={row.key}
        >
          <span
            aria-hidden="true"
            className="bg-muted absolute inset-y-0 left-0 w-(--bar) rounded-lg"
            style={
              { "--bar": `${(row.value / max) * PERCENT}%` } as CSSProperties
            }
          />
          <span className="relative flex min-w-0 flex-1 items-center gap-2">
            {row.label}
          </span>
          {row.detail ? (
            <span className="text-muted-foreground relative shrink-0 text-xs tabular-nums">
              {row.detail}
            </span>
          ) : null}
          <span className="relative shrink-0 tabular-nums">
            {formatChartInteger(row.value, locale)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function WebTrend({
  web,
  traffic,
  range,
}: Pick<WebVisitorsSectionProps, "web" | "traffic" | "range">) {
  const t = useTranslations("geo.webVisitors");
  const locale = useLocale();
  const rows = buildWebTrendRows(
    web.points,
    traffic?.points ?? [],
    locale,
    range?.from,
    range?.to
  );
  const share = webTrendShare(rows);
  if (rows.length === 0) {
    return null;
  }
  const markIncompleteTail = rows.at(-1)?.rawDay === todayIsoDate();
  const config: ChartConfig = {
    [WEB_TREND_PEOPLE_KEY]: {
      label: t("people"),
      colors: seriesColors(CHART_PRIMARY_COLOR),
    },
    [WEB_TREND_AGENTS_KEY]: {
      label: t("agentsSeries"),
      colors: seriesColors(CHART_SECONDARY_COLOR),
    },
  };
  const legend = [
    {
      key: WEB_TREND_PEOPLE_KEY,
      label: t("people"),
      share: share?.people,
      color: CHART_PRIMARY_COLOR,
    },
    {
      key: WEB_TREND_AGENTS_KEY,
      label: t("agentsSeries"),
      share: share?.agents,
      color: CHART_SECONDARY_COLOR,
    },
  ];

  return (
    <div className={TRAFFIC_HERO_CHART_SURFACE_CLASS}>
      <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium">{t("trendTitle")}</h3>
        <ul className="flex items-center gap-4 text-xs">
          {legend.map((entry) => (
            <li className="flex items-center gap-1.5" key={entry.key}>
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-(--dot-light) dark:bg-(--dot-dark)"
                style={
                  {
                    "--dot-light": entry.color.light,
                    "--dot-dark": entry.color.dark,
                  } as CSSProperties
                }
              />
              <span>{entry.label}</span>
              {entry.share === undefined ? null : (
                <span className="text-muted-foreground tabular-nums">
                  {t("share", { share: formatWebShare(entry.share) })}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <EChartsAreaChart
        animation={false}
        chartOptions={CHART_OPTIONS}
        className="h-52 w-full cursor-crosshair @md/hero:h-64"
        config={config}
        curveType="monotone"
        data={rows}
        stackType="stacked"
        xDataKey="day"
      >
        <EChartsAreaChart.Grid variant="solid" />
        <EChartsAreaChart.XAxis dataKey="day" />
        <EChartsAreaChart.YAxis />
        {[WEB_TREND_PEOPLE_KEY, WEB_TREND_AGENTS_KEY].map((key) => (
          <EChartsAreaChart.Area
            dataKey={key}
            enableBufferLine={markIncompleteTail}
            key={key}
            strokeVariant="solid"
            strokeWidth={TREND_STROKE_WIDTH}
            variant="gradient"
          >
            <EChartsAreaChart.ActiveDot variant="border" />
          </EChartsAreaChart.Area>
        ))}
        <EChartsAreaChart.Tooltip
          confine={false}
          labelFormatter={(day: string) => formatFullDayLabel(day, locale)}
          labelKey="rawDay"
          position="fixed"
          roundness="xl"
          scrub={rows.length > 1}
          valueFormatter={(value: number) => formatChartInteger(value, locale)}
        />
      </EChartsAreaChart>
    </div>
  );
}

/**
 * People and AI side by side for the selected domains: the KPI strip, page
 * views of both over time, then where people land, come from and what the
 * ones sent by an AI answer do next.
 */
export function WebVisitorsSection({
  web,
  traffic,
  range,
  domainCount,
}: WebVisitorsSectionProps) {
  const t = useTranslations("geo.webVisitors");
  const locale = useLocale();
  const { totals } = web;
  const aiTraffic = traffic ?? GEO_EMPTY_TRAFFIC_RESPONSE;
  const previousAi = toGeoTrafficPreviousTotals(
    aiTraffic.sources,
    aiTraffic.previousConversions
  );
  const trackedDomains = web.hosts.length;
  const readout =
    domainCount > 1 && trackedDomains > 0 && trackedDomains < domainCount
      ? t("domainReadout", { tracked: trackedDomains, total: domainCount })
      : null;

  const pageRows: WebBarListRow[] = web.pages
    .slice(0, WEB_LIST_LIMIT)
    .map((page) => ({
      key: `${page.host}${page.path}`,
      label: <TruncateWithTooltip>{page.path}</TruncateWithTooltip>,
      value: page.views,
      detail:
        page.aiVisitors > 0
          ? t("aiVisitorsDetail", { count: page.aiVisitors })
          : undefined,
    }));
  const sourceRows: WebBarListRow[] = web.sources
    .slice(0, WEB_LIST_LIMIT)
    .map((source) => {
      const name = webSourceName(source, t("direct"));
      return {
        key: `${source.group}:${source.source}`,
        label: (
          <>
            {source.group === "ai" ? (
              <EngineIcon className="size-3.5" engine={source.source} />
            ) : null}
            <span className="truncate">{name}</span>
          </>
        ),
        value: source.sessions,
      };
    });
  const countryRows: WebBarListRow[] = web.countries.map((row) => ({
    key: row.value || "unknown",
    label: row.value ? (
      <>
        <CountryFlag className="size-3.5" code={row.value} />
        <span className="truncate">{countryName(row.value, locale)}</span>
      </>
    ) : (
      <span className="truncate">{t("unknownCountry")}</span>
    ),
    value: row.visitors,
  }));
  const deviceLabels: Record<string, string> = {
    desktop: t("deviceDesktop"),
    mobile: t("deviceMobile"),
    tablet: t("deviceTablet"),
  };
  const deviceRows: WebBarListRow[] = web.devices.map((row) => ({
    key: row.value,
    label: (
      <span className="truncate">{deviceLabels[row.value] ?? row.value}</span>
    ),
    value: row.visitors,
  }));
  const outcomeRows = web.outcomes.filter((row) => row.sessions > 0);

  return (
    <section className="flex flex-col gap-6">
      <div className={TRAFFIC_HERO_FRAME_CLASS}>
        <div
          className={`${TRAFFIC_HERO_METRICS_GRID_CLASS} ${TRAFFIC_HERO_METRICS_SURFACE_CLASS}`}
        >
          <WebMetric
            label={t("visitors")}
            previous={totals.previousVisitors}
            value={totals.visitors}
          />
          <WebMetric
            label={t("views")}
            previous={totals.previousViews}
            value={totals.views}
          />
          <WebMetric
            label={t("fromAi")}
            previous={totals.previousAiVisitors}
            value={totals.aiVisitors}
          />
          <WebMetric
            label={t("agents")}
            previous={previousAi?.crawler ?? 0}
            value={aiTraffic.totals.crawler}
          />
        </div>
        <WebTrend range={range} traffic={traffic} web={web} />
        {readout ? (
          <p className="text-muted-foreground mt-2 text-xs">{readout}</p>
        ) : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <InstrumentModule eyebrow={t("topPages")} variant="panel">
          <WebBarList
            emptyMessage={t("noData")}
            rows={pageRows}
            valueLabel={t("topPages")}
          />
        </InstrumentModule>
        <InstrumentModule eyebrow={t("sources")} variant="panel">
          <WebBarList
            emptyMessage={t("noData")}
            rows={sourceRows}
            valueLabel={t("sources")}
          />
        </InstrumentModule>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <InstrumentModule eyebrow={t("countries")} variant="panel">
          <WebBarList
            emptyMessage={t("noData")}
            rows={countryRows}
            valueLabel={t("countries")}
          />
        </InstrumentModule>
        <InstrumentModule eyebrow={t("devices")} variant="panel">
          <WebBarList
            emptyMessage={t("noData")}
            rows={deviceRows}
            valueLabel={t("devices")}
          />
        </InstrumentModule>
        <InstrumentModule eyebrow={t("outcomesTitle")} variant="panel">
          {outcomeRows.length === 0 ? (
            <InstrumentEmpty
              className="min-h-40"
              message={t("noData")}
              seed="web-outcomes"
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs">
                  <th className="pb-2 text-left font-normal" scope="col">
                    <span className="sr-only">{t("sources")}</span>
                  </th>
                  <th className="pb-2 text-right font-normal" scope="col">
                    {t("pagesPerSession")}
                  </th>
                  <th className="pb-2 text-right font-normal" scope="col">
                    {t("engagedRate")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {outcomeRows.map((row) => (
                  <tr className="h-8" key={row.source || "all"}>
                    <th className="text-left font-normal" scope="row">
                      <span className="flex min-w-0 items-center gap-2">
                        {row.source ? (
                          <EngineIcon
                            className="size-3.5"
                            engine={row.source}
                          />
                        ) : null}
                        <span className="truncate">
                          {row.source
                            ? formatGeoSource(row.source)
                            : t("outcomesAll")}
                        </span>
                      </span>
                    </th>
                    <td className="text-right tabular-nums">
                      {row.pagesPerSession.toLocaleString(locale, {
                        maximumFractionDigits: 1,
                      })}
                    </td>
                    <td className="text-right tabular-nums">
                      {row.engagedRate.toLocaleString(locale, {
                        style: "percent",
                        maximumFractionDigits: 0,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </InstrumentModule>
      </div>
    </section>
  );
}
