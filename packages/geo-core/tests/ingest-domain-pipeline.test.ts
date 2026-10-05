import { beforeEach, expect, mock, test } from "bun:test";

import { Effect } from "effect";

import type { GeoIngestIdentity } from "../src/types/geo";
import type { GeoIngestDefer } from "../src/types/ingest";

const identity: GeoIngestIdentity = {
  organizationId: "org",
  projectId: "project",
  generation: 1,
};
const isActive = mock(async () => true);
const record = mock(async () => undefined);
const allowed = mock(async (): Promise<string[] | null> => ["example.com"]);
mock.module("@notra/geo-core/geo/ingest", () => ({
  verifyGeoIngestToken: () => identity,
}));
mock.module("../src/ingest/identity", () => ({
  isGeoIngestIdentityActive: isActive,
}));
mock.module("../src/ingest/hosts", () => ({ loadIngestAllowedHosts: allowed }));
mock.module("../src/ingest/domains", () => ({
  recordPendingIngestDomain: record,
}));
mock.module("../src/ingest/journey", () => ({
  resolveJourneyId: () => ({ journeyId: "fixture", path: "/" }),
}));
const { runGeoIngest } = await import("../src/ingest/pipeline");

beforeEach(() => {
  record.mockClear();
  record.mockImplementation(async () => undefined);
  isActive.mockImplementation(async () => true);
  allowed.mockImplementation(async () => ["example.com"]);
});

test("only authenticated dropped AI traffic schedules a domain suggestion without ingesting it", async () => {
  const tasks: Parameters<GeoIngestDefer>[0][] = [];
  const request = new Request("https://ingest.example/api/geo/ingest", {
    method: "POST",
    headers: { authorization: "Bearer test" },
    body: JSON.stringify({
      method: "GET",
      url: "https://new.example/path?private=value",
      userAgent: "GPTBot",
    }),
  });
  const result = await Effect.runPromise(
    runGeoIngest(request, (task) => tasks.push(task))
  );
  expect(result).toMatchObject({ outcome: "dropped", reason: "host" });
  expect(record).not.toHaveBeenCalled();
  expect(tasks).toHaveLength(1);
  await tasks[0]?.();
  expect(record).toHaveBeenCalledWith(identity, "new.example");
});

test("human traffic and revoked tokens cannot create suggestions", async () => {
  for (const userAgent of ["Mozilla/5.0", "GPTBot"]) {
    isActive.mockImplementation(async () => false);
    const tasks: Parameters<GeoIngestDefer>[0][] = [];
    const request = new Request("https://ingest.example/api/geo/ingest", {
      method: "POST",
      headers: { authorization: "Bearer test" },
      body: JSON.stringify({
        method: "GET",
        url: "https://new.example/",
        userAgent,
      }),
    });
    await Effect.runPromise(
      Effect.result(runGeoIngest(request, (task) => tasks.push(task)))
    );
    expect(tasks).toHaveLength(0);
  }
  expect(record).not.toHaveBeenCalled();
});

test("a suggestion-store outage does not change the dropped-event response", async () => {
  record.mockImplementation(async () => {
    throw new Error("Redis unavailable");
  });
  const tasks: Parameters<GeoIngestDefer>[0][] = [];
  const request = new Request("https://ingest.example/api/geo/ingest", {
    method: "POST",
    headers: { authorization: "Bearer test" },
    body: JSON.stringify({
      method: "GET",
      url: "https://new.example/",
      userAgent: "GPTBot",
    }),
  });
  const result = await Effect.runPromise(
    runGeoIngest(request, (task) => tasks.push(task))
  );
  expect(result).toMatchObject({ outcome: "dropped", reason: "host" });
  await tasks[0]?.();
});
