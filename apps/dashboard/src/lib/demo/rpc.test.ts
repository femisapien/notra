import { describe, expect, test } from "bun:test";

import { trackedPromptScanId } from "@notra/geo-core/geo/prompts";
import { geoShelfListResponseSchema } from "@notra/schemas/dashboard/geo-shelf";

import { DEMO_PROMPTS } from "@/constants/demo/geo";
import { DEMO_ANALYTICS } from "@/constants/demo/studio";
import { isDemoPath } from "@/lib/demo/is-demo";
import { demoRpc } from "@/lib/demo/rpc";
import type { LeaderboardResponse } from "@/types/analytics";

describe("public demo isolation", () => {
  test("automation suggestions have the array shape consumed by both automation pages", async () => {
    const suggestions = await demoRpc(["onboarding", "suggestions"], {});
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions).toEqual([]);
  });

  test("the impressions card receives the same account totals as the analytics overview", async () => {
    const leaderboard = (await demoRpc(["analytics", "leaderboard"], {
      days: 30,
    })) as LeaderboardResponse;
    expect(leaderboard.configured).toBe(true);
    expect(leaderboard.entries.length).toBe(DEMO_ANALYTICS.accounts.length);
    expect(
      leaderboard.entries.reduce(
        (sum, account) => sum + (account.impressions ?? 0),
        0
      )
    ).toBe(
      DEMO_ANALYTICS.accounts.reduce(
        (sum, account) => sum + (account.impressions ?? 0),
        0
      )
    );
  });

  test("only the reserved demo route enables fixtures", () => {
    expect(isDemoPath("/demo")).toBe(true);
    expect(isDemoPath("/demo/geo")).toBe(true);
    expect(isDemoPath("/demographic/geo")).toBe(false);
    expect(isDemoPath("/neon/geo")).toBe(false);
    expect(isDemoPath("/rpc")).toBe(false);
  });

  test("mutations and unknown reads cannot fall through to a live API", async () => {
    for (const path of [
      "geo.scan",
      "geo.promptsCreate",
      "brand.voices.update",
      "content.update",
      "apiKeys.create",
      "unknown.read",
    ]) {
      await expect(
        demoRpc(path.split("."), { organizationId: "real-org" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  test("callers cannot mutate the shared fixture records", async () => {
    const first = (await demoRpc(["geo", "promptsList"], {})) as {
      prompts: { prompt: string }[];
    };
    const original = first.prompts[0];
    if (!original) {
      throw new Error("Missing fixture prompt");
    }
    original.prompt = "Changed locally";
    const second = (await demoRpc(["geo", "promptsList"], {})) as typeof first;
    expect(second.prompts[0]?.prompt).toBe(DEMO_PROMPTS[0]?.prompt);
  });

  test("prompt answers use the scan ids expected by original dashboard dialogs", async () => {
    const response = (await demoRpc(["geo", "promptResultSummaries"], {})) as {
      results: { promptId: string; checkId: string }[];
    };
    for (const prompt of DEMO_PROMPTS) {
      const result = response.results.find(
        (item) => item.promptId === trackedPromptScanId(prompt)
      );
      expect(result).toBeDefined();
      if (!result) {
        throw new Error("Missing fixture answer");
      }
      const detail = (await demoRpc(["geo", "promptResultDetail"], {
        checkId: result.checkId,
      })) as { result: { promptId: string } };
      expect(detail.result.promptId).toBe(result.promptId);
    }
  });

  test("shelf data satisfies the real response schema", async () => {
    expect(
      geoShelfListResponseSchema.safeParse(
        await demoRpc(["geo", "shelfList"], {})
      ).success
    ).toBe(true);
  });
});
