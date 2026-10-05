import "./utils/infrastructure";
import { afterAll, beforeAll, beforeEach, expect, mock, test } from "bun:test";

import { geoSettings } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { Effect } from "effect";

import {
  GEO_PENDING_DOMAIN_TTL_SECONDS,
  GEO_RECORD_PENDING_DOMAIN_SCRIPT,
  GEO_IGNORE_PENDING_DOMAIN_SCRIPT,
} from "../src/constants/ingest-domains";
import { ingestDomainKeys } from "../src/utils/ingest-domain-keys";
import {
  database,
  initializeDatabase,
  resetDatabase,
  seedProject,
  settingsFor,
  testDb,
} from "./utils/database";

const client = {
  get: mock(async () => null),
  set: mock(async () => "OK"),
  del: mock(async () => 1),
  eval: mock(
    async (_script: string, _keys: string[], _args: (string | number)[]) => 1
  ),
  zrange: mock(async (): Promise<string[]> => []),
  zscore: mock(async (): Promise<number | null> => Date.now()),
  zrem: mock(async () => 1),
};
mock.module("@notra/ai/utils/redis", () => ({ redis: client }));

const { listPendingIngestDomains, actOnPendingIngestDomain } =
  await import("../src/geo/ingest-domains");
const { recordPendingIngestDomain } = await import("../src/ingest/domains");

beforeAll(initializeDatabase, 30_000);
afterAll(() => database.postgres.close());
beforeEach(async () => {
  await resetDatabase();
  for (const fn of Object.values(client)) {
    fn.mockClear();
  }
  client.zscore.mockImplementation(async () => Date.now());
  client.zrange.mockImplementation(async () => []);
});

test("records only a canonical hostname with bounded, expiring suggestions", async () => {
  const scope = await seedProject("first");
  await recordPendingIngestDomain({ ...scope, generation: 1 }, "WWW.Bücher.de");
  expect(client.eval).toHaveBeenCalledWith(
    GEO_RECORD_PENDING_DOMAIN_SCRIPT,
    Object.values(ingestDomainKeys(scope.organizationId, scope.projectId)),
    [
      "xn--bcher-kva.de",
      expect.any(Number),
      20,
      expect.any(Number),
      GEO_PENDING_DOMAIN_TTL_SECONDS,
    ]
  );
});

test("invalid hosts never create suggestions", async () => {
  await recordPendingIngestDomain(
    { organizationId: "org", projectId: "project", generation: 1 },
    "localhost"
  );
  expect(client.eval).not.toHaveBeenCalled();
});

test("legacy tokens use the oldest project's suggestion scope", async () => {
  const scope = await seedProject("first");
  await recordPendingIngestDomain(
    { organizationId: scope.organizationId, projectId: null, generation: 1 },
    "extra.example"
  );
  expect(client.eval.mock.calls[0]?.[1]).toEqual(
    Object.values(ingestDomainKeys(scope.organizationId, scope.projectId))
  );
});

test("listing excludes already allowed hosts, their subdomains and invalid stored values", async () => {
  const scope = await seedProject("first");
  await testDb
    .update(geoSettings)
    .set({ domains: ["allowed.example"] })
    .where(eq(geoSettings.projectId, scope.projectId));
  client.zrange.mockImplementation(async () => [
    "example.com",
    "www.example.com",
    "sub.allowed.example",
    "localhost",
    "new.example",
  ]);
  expect(await Effect.runPromise(listPendingIngestDomains(scope))).toEqual({
    domains: ["new.example"],
  });
});

test("one-click add preserves domains and invalidates project and legacy allowlists", async () => {
  const scope = await seedProject("first");
  await testDb
    .update(geoSettings)
    .set({ domains: ["existing.example"] })
    .where(eq(geoSettings.projectId, scope.projectId));
  await Effect.runPromise(
    actOnPendingIngestDomain({ ...scope, domain: "new.example", action: "add" })
  );
  expect((await settingsFor(scope.projectId))?.domains).toEqual([
    "existing.example",
    "new.example",
  ]);
  expect(client.del).toHaveBeenCalledTimes(2);
  expect(client.zrem).toHaveBeenCalledWith(
    ingestDomainKeys(scope.organizationId, scope.projectId).pending,
    "new.example"
  );
});

test("concurrent adds do not lose another domain or duplicate the same domain", async () => {
  const scope = await seedProject("first");
  await Promise.all(
    ["one.example", "two.example", "one.example"].map((domain) =>
      Effect.runPromise(
        actOnPendingIngestDomain({ ...scope, domain, action: "add" })
      )
    )
  );
  expect((await settingsFor(scope.projectId))?.domains.toSorted()).toEqual([
    "one.example",
    "two.example",
  ]);
});

test("full allowlists reject new domains without hiding the suggestion", async () => {
  const domains = Array.from({ length: 20 }, (_, i) => `domain${i}.example`);
  const scope = await seedProject("first");
  await testDb
    .update(geoSettings)
    .set({ domains })
    .where(eq(geoSettings.projectId, scope.projectId));
  await expect(
    Effect.runPromise(
      actOnPendingIngestDomain({
        ...scope,
        domain: "new.example",
        action: "add",
      })
    )
  ).rejects.toThrow();
  expect((await settingsFor(scope.projectId))?.domains).toEqual(domains);
  expect(client.zrem).not.toHaveBeenCalled();
});

test("ignore atomically removes the suggestion and remembers it without changing allowed domains", async () => {
  const scope = await seedProject("first");
  await Effect.runPromise(
    actOnPendingIngestDomain({
      ...scope,
      domain: "new.example",
      action: "ignore",
    })
  );
  expect(client.eval).toHaveBeenCalledWith(
    GEO_IGNORE_PENDING_DOMAIN_SCRIPT,
    Object.values(ingestDomainKeys(scope.organizationId, scope.projectId)),
    ["new.example"]
  );
  expect((await settingsFor(scope.projectId))?.domains).toEqual([]);
});

test("unseen and expired suggestions cannot be added", async () => {
  const scope = await seedProject("first");
  for (const seen of [
    null,
    Date.now() - (GEO_PENDING_DOMAIN_TTL_SECONDS + 1) * 1000,
  ]) {
    client.zscore.mockImplementation(async () => seen);
    await expect(
      Effect.runPromise(
        actOnPendingIngestDomain({
          ...scope,
          domain: "new.example",
          action: "add",
        })
      )
    ).rejects.toThrow();
  }
  expect((await settingsFor(scope.projectId))?.domains).toEqual([]);
});

test("project ownership is checked before reading or writing suggestions", async () => {
  const scope = await seedProject("first");
  const foreign = { ...scope, organizationId: "other-org" };
  await expect(
    Effect.runPromise(listPendingIngestDomains(foreign))
  ).rejects.toThrow();
  await expect(
    Effect.runPromise(
      actOnPendingIngestDomain({
        ...foreign,
        domain: "new.example",
        action: "ignore",
      })
    )
  ).rejects.toThrow();
  expect(client.zrange).not.toHaveBeenCalled();
  expect(client.eval).not.toHaveBeenCalled();
});
