import { geoShelfListInputSchema } from "@notra/schemas/dashboard/geo-shelf";

import { DEMO_COMPETITORS } from "@/constants/demo/geo";
import { DEMO_SHELF, DEMO_SHELF_MEMBERS } from "@/constants/demo/opportunities";
import {
  compareGeoShelfSources,
  countGeoShelfBoardColumns,
  matchesGeoShelfSourceFilters,
} from "@/utils/geo-shelf-live-query";

export function readDemoShelf(input: unknown) {
  const filters = geoShelfListInputSchema
    .pick({
      search: true,
      shelf: true,
      ticket: true,
      sortKey: true,
      sortDirection: true,
      offset: true,
    })
    .parse(input);
  const sources = DEMO_SHELF.sources
    .filter((source) =>
      matchesGeoShelfSourceFilters(
        source,
        { ...filters, currentMemberId: "demo-member-jamie" },
        DEMO_SHELF_MEMBERS,
        DEMO_COMPETITORS
      )
    )
    .sort((a, b) =>
      compareGeoShelfSources(a, b, {
        key: filters.sortKey,
        direction: filters.sortDirection,
      })
    );
  return {
    ...DEMO_SHELF,
    sources: sources.slice(filters.offset),
    filteredCount: sources.length,
    boardCounts: countGeoShelfBoardColumns(sources),
  };
}
