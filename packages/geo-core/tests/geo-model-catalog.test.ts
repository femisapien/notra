import { describe, expect, test } from "bun:test";
import assert from "node:assert/strict";

import type { GeoGatewayModel, GeoModelCatalog } from "../src/types/geo";
import {
  buildGeoModelCatalogFromFeed,
  geoModelsForProvider,
  getGeoModelCatalogEntry,
} from "../src/utils/geo-model-catalog";

function day(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getTime() / 1000;
}

function feedModel(id: string, released: string): GeoGatewayModel {
  return {
    id,
    name: id,
    owned_by: id.slice(0, id.indexOf("/")),
    type: "language",
    zdr: "all",
    released: day(released),
  };
}

function entry(catalog: GeoModelCatalog, id: string) {
  const found = getGeoModelCatalogEntry(catalog, id);
  assert.ok(found);
  return found;
}

describe("GEO model picker rules", () => {
  test("hides superseded releases of the same family", () => {
    const catalog = buildGeoModelCatalogFromFeed([
      feedModel("anthropic/claude-sonnet-5", "2026-06-29"),
      feedModel("anthropic/claude-sonnet-4.6", "2026-03-01"),
    ]);

    expect(entry(catalog, "anthropic/claude-sonnet-5").hidden).toBeUndefined();
    expect(entry(catalog, "anthropic/claude-sonnet-4.6").hidden).toBe(true);
  });

  test("hides niche variants even when they are the newest release", () => {
    const catalog = buildGeoModelCatalogFromFeed([
      feedModel("anthropic/claude-sonnet-5-nano", "2026-09-01"),
      feedModel("anthropic/claude-sonnet-5", "2026-06-29"),
    ]);

    expect(entry(catalog, "anthropic/claude-sonnet-5-nano").hidden).toBe(true);
    expect(entry(catalog, "anthropic/claude-sonnet-5").hidden).toBeUndefined();
  });

  test("never hides default engines, even when superseded", () => {
    const catalog = buildGeoModelCatalogFromFeed([
      feedModel("google/gemini-9.9-flash", "2026-09-10"),
      // google/gemini-3.8-flash is part of GEO_DEFAULT_ENGINE_IDS.
      feedModel("google/gemini-3.8-flash", "2026-09-02"),
    ]);

    const defaultEntry = entry(catalog, "google/gemini-3.8-flash");
    expect(defaultEntry.default).toBe(true);
    expect(defaultEntry.hidden).toBeUndefined();
    expect(entry(catalog, "google/gemini-9.9-flash").hidden).toBeUndefined();
  });

  test("lists hidden models in the picker only while selected", () => {
    const catalog = buildGeoModelCatalogFromFeed([
      feedModel("anthropic/claude-sonnet-5", "2026-06-29"),
      feedModel("anthropic/claude-sonnet-4.6", "2026-03-01"),
    ]);
    const pickerIds = (selected?: Set<string>) =>
      geoModelsForProvider(catalog, "anthropic", selected).map(
        (model) => model.id
      );

    // Hidden entries stay in the catalog so stored selections keep resolving.
    expect(
      getGeoModelCatalogEntry(catalog, "anthropic/claude-sonnet-4.6")
    ).toBeDefined();
    expect(pickerIds()).toEqual(["anthropic/claude-sonnet-5"]);
    expect(pickerIds(new Set(["anthropic/claude-sonnet-4.6"]))).toEqual([
      "anthropic/claude-sonnet-5",
      "anthropic/claude-sonnet-4.6",
    ]);
  });
});
