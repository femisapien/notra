"use client";

import { GEO_EMPTY_TRAFFIC_RESPONSE } from "@notra/geo-core/constants/geo";
import type {
  WebAnalyticsOutcome,
  WebAnalyticsSource,
} from "@notra/geo-core/types/geo";
import {
  formatGeoSource,
  toGeoTrafficPreviousTotals,
  trafficVisitDelta,
} from "@notra/geo-core/utils/ai-traffic";
import { todayIsoDate } from "@notra/geo-core/utils/day-label";
import { trafficLogHostFilter } from "@notra/geo-core/utils/geo-project-domains";
import { AnimatedNumber } from "@notra/ui/components/animated-number";
import { GeoBar } from "@notra/ui/components/geo/geo-bar";
import { InstrumentSection } from "@notra/ui/components/instrument/instrument-module";
import { TruncateWithTooltip } from "@notra/ui/components/shared/truncate-with-tooltip";
import {
  DataTable,
  type TableColumn,
} from "@notra/ui/components/ui/data-table";
import type { CSSProperties } from "react";
import { useLocale, useTranslations } from "use-intl";

import { EChartsAreaChart } from "@/components/evilcharts/charts/echarts-area-chart";
import { EngineIcon } from "@/components/geo/engine-icon";
import { GeoStatDelta } from "@/components/geo/geo-stat-delta";
import { CountryFlag } from "@/components/geo/twemoji";
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
  WEB_SOURCE_LABELS,
  WEB_TABLE_MIN_ROWS,
  WEB_TABLE_ROW_HEIGHT,
  WEB_TREND_AGENTS_KEY,
  WEB_TREND_PEOPLE_KEY,
} from "@/constants/web-analytics";
import type { ChartConfig } from "@/types/charts";
import type {
  WebBreakdownRow,
  WebBreakdownTableProps,
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

function webSourceName(
  source: WebAnalyticsSource,
  directLabel: string
): string {
  if (source.group === "direct") {
    return directLabel;
  }
  if (source.group === "ai") {
    return formatGeoSource(source.source);
  }
  return WEB_SOURCE_LABELS[source.source] ?? source.source;
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

function webTableHeight(rowCount: number): number {
  return (Math.max(rowCount, WEB_TABLE_MIN_ROWS) + 1) * WEB_TABLE_ROW_HEIGHT;
}

/** Name, an optional "from AI" count, and the value with its bar. */
function WebBreakdownTable({
  title,
  nameHeader,
  valueHeader,
  rows,
  showFromAi = false,
}: WebBreakdownTableProps) {
  const t = useTranslations("geo.webVisitors");
  const locale = useLocale();
  const max = Math.max(...rows.map((row) => row.value), 1);
  const columns: TableColumn<WebBreakdownRow>[] = [
    {
      key: "name",
      header: nameHeader,
      width: "1fr",
      sortable: true,
      cell: (row) => (
        <span className="flex min-w-0 items-center gap-2 text-sm">
          {row.label}
        </span>
      ),
      sortValue: (row) => row.sortLabel,
    },
  ];
  if (showFromAi) {
    columns.push({
      key: "fromAi",
      header: t("columnFromAi"),
      width: "5.5rem",
      align: "right",
      sortable: true,
      collapsePriority: 1,
      cell: (row) => (
        <span className="text-muted-foreground text-sm tabular-nums">
          {row.fromAi ? formatChartInteger(row.fromAi, locale) : "-"}
        </span>
      ),
      sortValue: (row) => row.fromAi ?? 0,
    });
  }
  columns.push({
    key: "value",
    header: valueHeader,
    width: "9rem",
    sortable: true,
    cell: (row) => (
      <span className="flex items-center gap-2">
        <GeoBar className="w-14 shrink-0" max={max} value={row.value} />
        <span className="text-sm tabular-nums">
          {formatChartInteger(row.value, locale)}
        </span>
      </span>
    ),
    sortValue: (row) => row.value,
  });
  return (
    <InstrumentSection eyebrow={title}>
      <DataTable
        columns={columns}
        data={rows}
        defaultSort={{ key: "value", direction: "desc" }}
        emptyState={t("noData")}
        getRowId={(row) => row.key}
        height={webTableHeight(rows.length)}
        rowHeight={WEB_TABLE_ROW_HEIGHT}
        scrollFade={false}
      />
    </InstrumentSection>
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
      <h3 className="mb-3 text-sm font-medium">{t("trendTitle")}</h3>
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
      <ul className="border-border mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-3 text-xs">
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
}: WebVisitorsSectionProps) {
  const t = useTranslations("geo.webVisitors");
  const locale = useLocale();
  const { totals } = web;
  const aiTraffic = traffic ?? GEO_EMPTY_TRAFFIC_RESPONSE;
  const previousAi = toGeoTrafficPreviousTotals(
    aiTraffic.sources,
    aiTraffic.previousConversions
  );

  // The same path on two domains is two pages; name the domain when it matters.
  const showPageHost = new Set(web.pages.map((page) => page.host)).size > 1;
  const pageRows: WebBreakdownRow[] = web.pages
    .slice(0, WEB_LIST_LIMIT)
    .map((page) => ({
      key: `${page.host}${page.path}`,
      label: (
        <TruncateWithTooltip tooltip={`${page.host}${page.path}`}>
          {showPageHost ? (
            <span className="text-muted-foreground">
              {trafficLogHostFilter(page.host)}
            </span>
          ) : null}
          {page.path}
        </TruncateWithTooltip>
      ),
      sortLabel: `${page.host}${page.path}`,
      value: page.views,
      fromAi: page.aiVisitors,
    }));
  const sourceRows: WebBreakdownRow[] = web.sources
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
        sortLabel: name,
        value: source.sessions,
      };
    });
  const countryRows: WebBreakdownRow[] = web.countries.map((row) => ({
    key: row.value || "unknown",
    label: row.value ? (
      <>
        <CountryFlag className="size-3.5" code={row.value} />
        <span className="truncate">{countryName(row.value, locale)}</span>
      </>
    ) : (
      <span className="truncate">{t("unknownCountry")}</span>
    ),
    sortLabel: row.value ? countryName(row.value, locale) : t("unknownCountry"),
    value: row.visitors,
  }));
  const deviceLabels: Record<string, string> = {
    desktop: t("deviceDesktop"),
    mobile: t("deviceMobile"),
    tablet: t("deviceTablet"),
  };
  const deviceRows: WebBreakdownRow[] = web.devices.map((row) => ({
    key: row.value,
    label: (
      <span className="truncate">{deviceLabels[row.value] ?? row.value}</span>
    ),
    sortLabel: deviceLabels[row.value] ?? row.value,
    value: row.visitors,
  }));
  const outcomeRows = web.outcomes.filter((row) => row.sessions > 0);
  const outcomeColumns: TableColumn<WebAnalyticsOutcome>[] = [
    {
      key: "source",
      header: t("columnSource"),
      width: "1fr",
      cell: (row) => (
        <span className="flex min-w-0 items-center gap-2 text-sm">
          {row.source ? (
            <EngineIcon className="size-3.5" engine={row.source} />
          ) : null}
          <span className="truncate">
            {row.source ? formatGeoSource(row.source) : t("outcomesAll")}
          </span>
        </span>
      ),
    },
    {
      key: "pages",
      header: t("pagesPerSession"),
      width: "6rem",
      align: "right",
      cell: (row) => (
        <span className="text-sm tabular-nums">
          {row.pagesPerSession.toLocaleString(locale, {
            maximumFractionDigits: 1,
          })}
        </span>
      ),
    },
    {
      key: "engaged",
      header: t("engagedRate"),
      width: "8rem",
      cell: (row) => (
        <span className="flex items-center gap-2">
          <GeoBar className="w-10 shrink-0" value={row.engagedRate} />
          <span className="text-sm tabular-nums">
            {row.engagedRate.toLocaleString(locale, {
              style: "percent",
              maximumFractionDigits: 0,
            })}
          </span>
        </span>
      ),
    },
  ];

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
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <WebBreakdownTable
          nameHeader={t("page")}
          rows={pageRows}
          showFromAi
          title={t("topPages")}
          valueHeader={t("columnViews")}
        />
        <WebBreakdownTable
          nameHeader={t("columnSource")}
          rows={sourceRows}
          title={t("referrers")}
          valueHeader={t("sessions")}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <WebBreakdownTable
          nameHeader={t("columnCountry")}
          rows={countryRows}
          title={t("countries")}
          valueHeader={t("visitors")}
        />
        <WebBreakdownTable
          nameHeader={t("columnDevice")}
          rows={deviceRows}
          title={t("devices")}
          valueHeader={t("visitors")}
        />
      </div>
      <InstrumentSection eyebrow={t("outcomesTitle")}>
        <DataTable
          columns={outcomeColumns}
          data={outcomeRows}
          emptyState={t("noData")}
          getRowId={(row) => row.source || "all"}
          height={webTableHeight(outcomeRows.length)}
          rowHeight={WEB_TABLE_ROW_HEIGHT}
          scrollFade={false}
        />
      </InstrumentSection>
    </section>
  );
}
