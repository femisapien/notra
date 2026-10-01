import { expect, spyOn, test } from "bun:test";

import { ingestGeoTrafficEvents } from "./client";

test("GEO ingest aborts a stalled HTTP request at the supplied timeout", async () => {
  const previousToken = process.env.TINYBIRD_TOKEN;
  const previousBaseUrl = process.env.TINYBIRD_BASE_URL;
  process.env.TINYBIRD_TOKEN = "test-token";
  process.env.TINYBIRD_BASE_URL = "https://tinybird.invalid";
  const fetch = spyOn(globalThis, "fetch").mockImplementation(
    (_input, init) => {
      const signal = init?.signal;
      if (!signal) {
        throw new Error("Expected the SDK to supply an abort signal");
      }
      return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), {
          once: true,
        });
      });
    }
  );

  try {
    await expect(
      ingestGeoTrafficEvents(
        [
          {
            organization_id: "org_1",
            project_id: "proj_1",
            captured_at: "2026-10-01 00:00:00",
            visitor_type: "crawler",
            source: "GPTBot",
            agent: "GPTBot",
            category: "training-crawler",
            confidence: "certain",
            path: "/",
            host: "example.com",
            method: "GET",
            referer: "",
            ua: "GPTBot/1.0",
            country: "",
            language: "",
            request_id: "",
            journey_id: "journey_1",
            wants_markdown: false,
          },
        ],
        10
      )
    ).rejects.toMatchObject({ name: "TimeoutError" });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  } finally {
    fetch.mockRestore();
    if (previousToken === undefined) {
      delete process.env.TINYBIRD_TOKEN;
    } else {
      process.env.TINYBIRD_TOKEN = previousToken;
    }
    if (previousBaseUrl === undefined) {
      delete process.env.TINYBIRD_BASE_URL;
    } else {
      process.env.TINYBIRD_BASE_URL = previousBaseUrl;
    }
  }
});
