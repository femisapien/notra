import { describe, expect, test } from "bun:test";

import { renderToStaticMarkup } from "react-dom/server";

import GeoDefault from "../src/app/(dashboard)/[slug]/geo/default";
import GeoGapsLoading from "../src/app/(dashboard)/[slug]/geo/gaps/loading";

const OVERVIEW_SKELETON_COPY = "How AI engines talk about your brand";

describe("GEO nested route shells", () => {
  test("parallel-route default does not render the overview skeleton", () => {
    const html = renderToStaticMarkup(<GeoDefault />);
    expect(html).toBe("");
    expect(html).not.toContain(OVERVIEW_SKELETON_COPY);
  });

  test("content gaps loading shell is the gaps skeleton, not GEO overview", () => {
    const html = renderToStaticMarkup(<GeoGapsLoading />);
    expect(html).toContain("Content Gaps");
    expect(html).not.toContain(OVERVIEW_SKELETON_COPY);
    expect(html).not.toContain(">GEO<");
  });
});
