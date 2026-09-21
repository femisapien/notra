import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

import { geoAdhocScans, geoMentionChecks } from "@notra/db/schema";
import {
  GeoContentBillingService,
  GeoEntitlementService,
  GeoFeatureFlagService,
  GeoModelService,
} from "@notra/geo-core/deps";
import { ConfigProvider, Effect, Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";

import { seedGeoModelCatalog } from "../../../packages/geo-core/src/utils/geo-model-catalog";
import {
  fakeModels,
  testBillingGate,
  testFeatureFlags,
} from "../../../packages/geo-core/tests/constants/geo-boundaries";
import {
  database,
  initializeDatabase,
  resetDatabase,
  seedProject,
  testDb,
} from "../../../packages/geo-core/tests/utils/database";

mock.module("@notra/db/drizzle", () => ({ db: testDb }));
mock.module("@notra/ai/evlog", () => ({
  log: { info: mock(), warn: mock(), error: mock() },
  geoLog: { info: mock(), warn: mock(), error: mock() },
  geoLogDrainEnabled: true,
  flushGeoLog: async () => undefined,
}));
mock.module("../../../packages/geo-core/src/geo/model-catalog", () => ({
  loadGeoModelCatalog: () => Effect.succeed(seedGeoModelCatalog()),
}));

const { executeGeoAdhocScan } = await import("@notra/geo-core/geo/adhoc-scan");
const { routes } = await import("../src/http/routes");
const { RunQueue } = await import("../src/services/run-queue");

const SECRET = "test-runner-secret";
const ENGINE = "openai/gpt-5.4-mini";

const testGeoLayer = Layer.mergeAll(
  Layer.succeed(GeoModelService, {
    ...fakeModels,
    groundedAnswer: () =>
      Effect.succeed({
        text: "Notra is the best tool.",
        grounding: { queries: [], sources: [] },
        sources: [],
        finishReason: "stop",
        zdrEnforced: false,
        usage: {
          inputTokens: 1,
          outputTokens: 1,
          totalTokens: 2,
          inputTokenDetails: {
            noCacheTokens: 1,
            cacheReadTokens: 0,
            cacheWriteTokens: 0,
          },
          outputTokenDetails: { textTokens: 1, reasoningTokens: 0 },
        },
      }),
  }),
  Layer.succeed(GeoFeatureFlagService, testFeatureFlags),
  Layer.succeed(GeoEntitlementService, {
    resolveZdrEntitlement: () => Effect.succeed("not_entitled" as const),
  }),
  Layer.succeed(GeoContentBillingService, {
    gateContentBilling: () => Effect.succeed(testBillingGate),
    finalizeContentBilling: () => Effect.void,
  })
);

function makeHandler(accept: boolean) {
  const queue = Layer.succeed(
    RunQueue,
    RunQueue.of({
      offer: (scanId) =>
        accept
          ? executeGeoAdhocScan(scanId).pipe(
              Effect.provide(testGeoLayer),
              Effect.orDie,
              Effect.as(true)
            )
          : Effect.succeed(false),
    })
  );
  return HttpRouter.toWebHandler(
    Layer.merge(
      routes.pipe(Layer.provide(queue)),
      ConfigProvider.layer(
        ConfigProvider.fromUnknown({ GEO_RUNNER_SECRET: SECRET })
      )
    )
  );
}

function postScan(
  body: object,
  handler: (request: Request) => Promise<Response>
) {
  return handler(
    new Request("http://localhost/scans", {
      method: "POST",
      headers: {
        authorization: `Bearer ${SECRET}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    })
  );
}

beforeAll(initializeDatabase, 30_000);
afterAll(() => database.postgres.close());
beforeEach(resetDatabase);

describe("geo runner HTTP routes", () => {
  test("creates, runs, and returns a completed one-off scan", async () => {
    const scope = await seedProject("runner-complete");
    const app = makeHandler(true);

    const created = await postScan(
      { ...scope, prompt: "best tools", engines: [ENGINE] },
      app.handler
    );
    expect(created.status).toBe(202);
    const { id } = (await created.json()) as { id: string };

    const response = await app.handler(
      new Request(
        `http://localhost/scans/${id}?organizationId=${scope.organizationId}&projectId=${scope.projectId}`,
        { headers: { authorization: `Bearer ${SECRET}` } }
      )
    );
    expect(response.status).toBe(200);
    const scan = (await response.json()) as {
      status: string;
      results: { checks: unknown[] };
    };
    expect(scan.status).toBe("completed");
    expect(scan.results.checks).toHaveLength(1);
    expect(await testDb.select().from(geoMentionChecks)).toHaveLength(0);
    await app.dispose();
  });

  test("rejects unknown projects with 404", async () => {
    const app = makeHandler(true);
    const response = await postScan(
      {
        organizationId: "missing-org",
        projectId: "missing-project",
        prompt: "best tools",
        engines: [ENGINE],
      },
      app.handler
    );
    expect(response.status).toBe(404);
    await app.dispose();
  });

  test("removes a new scan when the queue rejects it", async () => {
    const scope = await seedProject("runner-busy");
    const app = makeHandler(false);
    const response = await postScan(
      { ...scope, prompt: "best tools", engines: [ENGINE] },
      app.handler
    );
    expect(response.status).toBe(503);
    expect(await testDb.select().from(geoAdhocScans)).toHaveLength(0);
    await app.dispose();
  });

  test("requires the runner secret", async () => {
    const app = makeHandler(true);
    const response = await app.handler(
      new Request("http://localhost/health/../scans", { method: "POST" })
    );
    expect(response.status).toBe(401);
    await app.dispose();
  });
});
