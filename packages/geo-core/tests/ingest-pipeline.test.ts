import { beforeEach, describe, expect, mock, test } from "bun:test";

import type { GeoIngestIdentity } from "@notra/geo-core/types/geo";
import type { Ratelimit } from "@upstash/ratelimit";
import { Effect } from "effect";

const STORED = { successful_rows: 1, quarantined_rows: 0 };
const ingestGeoTrafficEvents = mock(
  async (): Promise<typeof STORED | null> => STORED
);
const isGeoIngestIdentityActive = mock(async () => true);
const loadIngestAllowedHosts = mock(
  async (_identity?: GeoIngestIdentity): Promise<string[] | null> => [
    "example.com",
  ]
);
const ratelimitLimit = mock(
  async (): Promise<
    Pick<Awaited<ReturnType<Ratelimit["limit"]>>, "success" | "reason">
  > => ({
    success: true,
  })
);
const trackGeoIngestAnalytics = mock(() => Effect.void);
const verifyGeoIngestToken = mock((): GeoIngestIdentity => ({
  organizationId: "org_1",
  projectId: "proj_1",
  generation: 1,
}));
const verifyGeoIngestSiteToken = mock((token: string): string | null =>
  token === "nst.site_1.good" ? "site_1" : null
);
const loadIngestSite = mock(async (siteId: string) =>
  siteId === "site_1"
    ? {
        id: "site_1",
        organizationId: "org_2",
        projectId: "proj_2",
        hosts: ["acme.com"],
      }
    : null
);
const loadOrganizationSitePrefixes = mock(
  async (): Promise<{ host: string; mounts: string[] }[] | null> => []
);
const resolveJourneyId = mock(() => ({ journeyId: "journey_1", path: "/" }));

mock.module("@notra/analytics/tinybird/client", () => ({
  ingestGeoTrafficEvents,
}));
mock.module("@notra/geo-core/geo/ingest", () => ({
  verifyGeoIngestToken,
  verifyGeoIngestSiteToken,
  isGeoIngestSiteToken: (token: string) => token.startsWith("nst."),
  getGeoIngestTokenGeneration: async () => 1,
  geoIngestHostsCacheKey: () => "hosts:key",
}));
mock.module("../src/ingest/identity", () => ({
  isGeoIngestIdentityActive,
}));
mock.module("../src/ingest/hosts", () => ({
  loadIngestAllowedHosts,
}));
mock.module("../src/ingest/sites", () => ({
  loadIngestSite,
  loadOrganizationSitePrefixes,
}));
mock.module("../src/ingest/analytics", () => ({
  trackGeoIngestAnalytics,
}));
mock.module("../src/ingest/journey", () => ({
  resolveJourneyId,
}));
mock.module("../src/ingest/ratelimit", () => ({
  geoIngestRatelimit: { limit: ratelimitLimit },
}));

const { runGeoIngest } = await import("../src/ingest/pipeline");
const {
  GeoIngestInvalidPayloadError,
  GeoIngestInvalidTokenError,
  GeoIngestFailedError,
  GeoIngestRateLimitedError,
  GeoIngestUnparseableUrlError,
} = await import("../src/ingest/errors");

function ingestRequest(
  body: unknown = {
    method: "GET",
    url: "https://example.com/",
    userAgent: "GPTBot",
  },
  token = "token_1"
) {
  return {
    headers: new Headers({ authorization: `Bearer ${token}` }),
    json: async () => body,
  } as never;
}

async function run(request: unknown) {
  return Effect.runPromise(
    Effect.result(runGeoIngest(request as never, () => {})) as never
  ) as Promise<
    | { _tag: "Success"; success: unknown }
    | { _tag: "Failure"; failure: unknown }
  >;
}

describe("runGeoIngest ordering", () => {
  beforeEach(() => {
    for (const m of [
      ingestGeoTrafficEvents,
      isGeoIngestIdentityActive,
      loadIngestAllowedHosts,
      ratelimitLimit,
      trackGeoIngestAnalytics,
    ]) {
      m.mockClear();
    }
    verifyGeoIngestToken.mockClear();
    verifyGeoIngestToken.mockImplementation(() => ({
      organizationId: "org_1",
      projectId: "proj_1",
      generation: 1,
    }));
    resolveJourneyId.mockClear();
    isGeoIngestIdentityActive.mockImplementation(async () => true);
    loadIngestAllowedHosts.mockImplementation(async () => ["example.com"]);
    ratelimitLimit.mockImplementation(async () => ({ success: true }));
    ingestGeoTrafficEvents.mockImplementation(async () => STORED);
    loadOrganizationSitePrefixes.mockImplementation(async () => []);
  });

  test("fails instead of acknowledging when Tinybird is not configured", async () => {
    ingestGeoTrafficEvents.mockImplementation(async () => null);
    const outcome = await run(ingestRequest());
    expect(outcome._tag).toBe("Failure");
    if (outcome._tag === "Failure") {
      expect(outcome.failure).toBeInstanceOf(GeoIngestFailedError);
    }
  });

  test("fails instead of acknowledging a quarantined row", async () => {
    ingestGeoTrafficEvents.mockImplementation(async () => ({
      successful_rows: 0,
      quarantined_rows: 1,
    }));
    const outcome = await run(ingestRequest());
    expect(outcome._tag).toBe("Failure");
    if (outcome._tag === "Failure") {
      expect(outcome.failure).toBeInstanceOf(GeoIngestFailedError);
    }
  });

  test("drops untracked visitors without any Redis/DB/Tinybird I/O", async () => {
    const outcome = await run(
      ingestRequest({
        method: "GET",
        url: "https://example.com/",
        userAgent: "Mozilla/5.0",
      })
    );

    expect(outcome._tag).toBe("Success");
    expect(isGeoIngestIdentityActive).not.toHaveBeenCalled();
    expect(loadIngestAllowedHosts).not.toHaveBeenCalled();
    expect(ratelimitLimit).not.toHaveBeenCalled();
    expect(ingestGeoTrafficEvents).not.toHaveBeenCalled();
  });

  test("ingests tracked traffic after identity and host checks", async () => {
    const outcome = await run(ingestRequest());

    expect(outcome._tag).toBe("Success");
    expect(isGeoIngestIdentityActive).toHaveBeenCalledTimes(1);
    expect(loadIngestAllowedHosts).toHaveBeenCalledTimes(1);
    expect(ratelimitLimit).toHaveBeenCalledTimes(1);
    expect(ingestGeoTrafficEvents).toHaveBeenCalledTimes(1);
  });

  test("hands tracked traffic to the buffer instead of writing it", async () => {
    const buffered: unknown[] = [];
    const outcome = await Effect.runPromise(
      runGeoIngest(ingestRequest(), () => {}, {
        enqueue: (event) => {
          buffered.push(event);
          return true;
        },
        expedite: () => {},
      })
    );

    expect(outcome.outcome).toBe("ingested");
    expect(buffered).toHaveLength(1);
    expect(ingestGeoTrafficEvents).not.toHaveBeenCalled();
  });

  test("writes directly when the buffer refuses the event", async () => {
    await Effect.runPromise(
      runGeoIngest(ingestRequest(), () => {}, {
        enqueue: () => false,
        expedite: () => {},
      })
    );
    expect(ingestGeoTrafficEvents).toHaveBeenCalledTimes(1);
  });

  test("defers analytics until after the event was stored", async () => {
    const tasks: Array<() => Promise<void>> = [];
    await Effect.runPromise(
      runGeoIngest(ingestRequest(), (task) => tasks.push(task))
    );

    expect(ingestGeoTrafficEvents).toHaveBeenCalledTimes(1);
    expect(trackGeoIngestAnalytics).not.toHaveBeenCalled();
    expect(tasks).toHaveLength(1);
    await tasks[0]?.();
    expect(trackGeoIngestAnalytics).toHaveBeenCalledTimes(1);
  });

  test("rejects tracked traffic when the rate-limit transport fails", async () => {
    ratelimitLimit.mockImplementation(async () => {
      throw new Error("Redis unavailable");
    });
    const outcome = await run(ingestRequest());
    expect(outcome._tag).toBe("Failure");
    if (outcome._tag === "Failure") {
      expect(outcome.failure).toBeInstanceOf(GeoIngestFailedError);
    }
    expect(ingestGeoTrafficEvents).not.toHaveBeenCalled();
  });

  test("rejects Upstash timeout responses even when success is true", async () => {
    ratelimitLimit.mockImplementation(async () => ({
      success: true,
      reason: "timeout",
    }));
    const outcome = await run(ingestRequest());
    expect(outcome._tag).toBe("Failure");
    if (outcome._tag === "Failure") {
      expect(outcome.failure).toBeInstanceOf(GeoIngestFailedError);
    }
    expect(ingestGeoTrafficEvents).not.toHaveBeenCalled();
  });

  test("rejects actual rate-limit hits without writing an event", async () => {
    ratelimitLimit.mockImplementation(async () => ({ success: false }));
    const outcome = await run(ingestRequest());
    expect(outcome._tag).toBe("Failure");
    if (outcome._tag === "Failure") {
      expect(outcome.failure).toBeInstanceOf(GeoIngestRateLimitedError);
    }
    expect(ingestGeoTrafficEvents).not.toHaveBeenCalled();
  });

  test("rejects revoked identities for tracked traffic with 401", async () => {
    isGeoIngestIdentityActive.mockImplementation(async () => false);

    const outcome = await run(ingestRequest());

    expect(outcome._tag).toBe("Failure");
    if (outcome._tag === "Failure") {
      expect(outcome.failure).toBeInstanceOf(GeoIngestInvalidTokenError);
    }
    expect(ingestGeoTrafficEvents).not.toHaveBeenCalled();
  });

  test("drops tracked events for hosts outside the allowed list", async () => {
    loadIngestAllowedHosts.mockImplementation(async () => ["other.example"]);

    const outcome = await run(ingestRequest());

    expect(outcome._tag).toBe("Success");
    expect(ingestGeoTrafficEvents).not.toHaveBeenCalled();
  });

  test("legacy organization tokens do not ingest a sibling project's host", async () => {
    verifyGeoIngestToken.mockImplementation(() => ({
      organizationId: "org_1",
      projectId: null,
      generation: 1,
    }));
    loadIngestAllowedHosts.mockImplementation(async () => ["oldest.example"]);

    const outcome = await run(ingestRequest());

    expect(outcome._tag).toBe("Success");
    expect(loadIngestAllowedHosts).toHaveBeenCalledWith({
      organizationId: "org_1",
      projectId: null,
      generation: 1,
    });
    expect(ingestGeoTrafficEvents).not.toHaveBeenCalled();
  });

  test("legacy organization tokens fail closed if host lookup is unavailable", async () => {
    verifyGeoIngestToken.mockImplementation(() => ({
      organizationId: "org_1",
      projectId: null,
      generation: 1,
    }));
    loadIngestAllowedHosts.mockImplementation(async () => null);

    const outcome = await run(ingestRequest());

    expect(outcome._tag).toBe("Failure");
    if (outcome._tag === "Failure") {
      expect(outcome.failure).toBeInstanceOf(GeoIngestFailedError);
    }
    expect(ingestGeoTrafficEvents).not.toHaveBeenCalled();
  });

  test("keeps 401 authoritative when a revoked token sends a malformed payload", async () => {
    isGeoIngestIdentityActive.mockImplementation(async () => false);

    const outcome = await run(ingestRequest({ method: "GET" }));

    expect(outcome._tag).toBe("Failure");
    if (outcome._tag === "Failure") {
      expect(outcome.failure).toBeInstanceOf(GeoIngestInvalidTokenError);
    }
    expect(ingestGeoTrafficEvents).not.toHaveBeenCalled();
  });

  test("keeps 401 authoritative when a revoked token sends an unparseable url", async () => {
    isGeoIngestIdentityActive.mockImplementation(async () => false);

    const outcome = await run(ingestRequest({ method: "GET", url: ":::" }));

    expect(outcome._tag).toBe("Failure");
    if (outcome._tag === "Failure") {
      expect(outcome.failure).toBeInstanceOf(GeoIngestInvalidTokenError);
    }
    expect(ingestGeoTrafficEvents).not.toHaveBeenCalled();
  });

  test("returns 400 for malformed payloads while the identity is active", async () => {
    const outcome = await run(ingestRequest({ method: "GET" }));

    expect(outcome._tag).toBe("Failure");
    if (outcome._tag === "Failure") {
      expect(outcome.failure).toBeInstanceOf(GeoIngestInvalidPayloadError);
    }
  });

  test("returns 400 for unparseable urls while the identity is active", async () => {
    const outcome = await run(ingestRequest({ method: "GET", url: ":::" }));

    expect(outcome._tag).toBe("Failure");
    if (outcome._tag === "Failure") {
      expect(outcome.failure).toBeInstanceOf(GeoIngestUnparseableUrlError);
    }
  });

  test("a site token ingests under the site's project and only for its host", async () => {
    // The real lookup answers a site identity with the site's own hosts.
    loadIngestAllowedHosts.mockImplementation(
      async (identity?: GeoIngestIdentity) =>
        identity?.site ? identity.site.hosts : ["example.com"]
    );
    const page = {
      method: "GET",
      url: "https://acme.com/blog/a",
      userAgent: "GPTBot",
    };
    const outcome = await run(ingestRequest(page, "nst.site_1.good"));
    expect(outcome).toMatchObject({
      _tag: "Success",
      success: {
        outcome: "ingested",
        organizationId: "org_2",
        projectId: "proj_2",
      },
    });
    expect(verifyGeoIngestToken).not.toHaveBeenCalled();

    const elsewhere = await run(
      ingestRequest({ ...page, url: "https://example.com/" }, "nst.site_1.good")
    );
    expect(elsewhere).toMatchObject({
      _tag: "Success",
      success: { outcome: "dropped", reason: "host" },
    });
  });

  test("a forged or orphaned site token is a 401", async () => {
    const forged = await run(ingestRequest(undefined, "nst.site_1.bad"));
    expect(forged._tag === "Failure" && forged.failure).toBeInstanceOf(
      GeoIngestInvalidTokenError
    );
    verifyGeoIngestSiteToken.mockImplementationOnce(() => "site_gone");
    const orphaned = await run(ingestRequest(undefined, "nst.site_gone.sig"));
    expect(orphaned._tag === "Failure" && orphaned.failure).toBeInstanceOf(
      GeoIngestInvalidTokenError
    );
  });

  test("the SDK does not count a page a Notra Site already reports", async () => {
    loadOrganizationSitePrefixes.mockImplementation(async () => [
      { host: "example.com", mounts: ["/blog"] },
    ]);
    const proxied = await run(
      ingestRequest({
        method: "GET",
        url: "https://example.com/blog/a",
        userAgent: "GPTBot",
      })
    );
    expect(proxied).toMatchObject({
      _tag: "Success",
      success: { outcome: "dropped", reason: "site" },
    });
    const outside = await run(
      ingestRequest({
        method: "GET",
        url: "https://example.com/blogroll",
        userAgent: "GPTBot",
      })
    );
    expect(outside).toMatchObject({
      _tag: "Success",
      success: { outcome: "ingested" },
    });
  });
});
