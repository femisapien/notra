import {
  createGeoAdhocScan,
  discardQueuedGeoAdhocScan,
  getGeoAdhocScan,
} from "@notra/geo-core/geo/adhoc-scan";
import { type Context, Effect, Schema } from "effect";
import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from "effect/unstable/http";

import { geoRunnerLayer } from "../layers/geo";
import { RunQueue } from "../services/run-queue";
import { isAuthorized } from "./auth";

const CreateScanBody = Schema.Struct({
  organizationId: Schema.String,
  projectId: Schema.String,
  prompt: Schema.String,
  engines: Schema.Array(Schema.String),
  webSearch: Schema.optional(Schema.Boolean),
  language: Schema.optional(Schema.String),
});

const ScanScope = Schema.Struct({
  organizationId: Schema.String,
  projectId: Schema.String,
});

const ScanPath = Schema.Struct({ scanId: Schema.String });

function failure(status: number, code: string, message: string) {
  return HttpServerResponse.jsonUnsafe(
    { error: { code, message } },
    { status }
  );
}

const unauthorized = failure(401, "unauthorized", "Invalid runner credentials");

function guarded<E, R>(
  handler: Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>
) {
  return Effect.gen(function* () {
    if (!(yield* isAuthorized)) {
      return unauthorized;
    }
    return yield* handler;
  });
}

type RunQueueShape = Context.Service.Shape<typeof RunQueue>;

const enqueue = (queue: RunQueueShape, scanId: string) =>
  queue
    .offer(scanId)
    .pipe(
      Effect.map((accepted) =>
        accepted
          ? HttpServerResponse.jsonUnsafe(
              { id: scanId, status: "queued" },
              { status: 202 }
            )
          : failure(
              503,
              "runner_busy",
              "The runner backlog is full. Retry shortly."
            )
      )
    );

const createScan = (queue: RunQueueShape) =>
  guarded(
    Effect.gen(function* () {
      const body = yield* HttpServerRequest.schemaBodyJson(CreateScanBody);
      const { id } = yield* createGeoAdhocScan(body).pipe(
        Effect.provide(geoRunnerLayer)
      );
      const accepted = yield* queue.offer(id);
      if (!accepted) {
        yield* discardQueuedGeoAdhocScan(id);
        return failure(
          503,
          "runner_busy",
          "The runner backlog is full. Retry shortly."
        );
      }
      return HttpServerResponse.jsonUnsafe(
        { id, status: "queued" },
        { status: 202 }
      );
    }).pipe(
      Effect.catchTags({
        SchemaError: (error) =>
          Effect.succeed(failure(400, "invalid_request", error.message)),
        GeoAdhocScanInvalidError: (error) =>
          Effect.succeed(failure(422, "invalid_scan", error.message)),
        GeoProjectNotFoundError: () =>
          Effect.succeed(
            failure(404, "project_not_found", "Project not found")
          ),
        GeoSettingsMissingError: () =>
          Effect.succeed(
            failure(
              404,
              "project_not_found",
              "GEO is not set up for this project"
            )
          ),
      })
    )
  );

/** Hand-off for hosts that already stored the `queued` row themselves. */
const runScan = (queue: RunQueueShape) =>
  guarded(
    Effect.gen(function* () {
      const { scanId } = yield* HttpRouter.schemaPathParams(ScanPath);
      return yield* enqueue(queue, scanId);
    })
  );

const getScan = guarded(
  Effect.gen(function* () {
    const { scanId } = yield* HttpRouter.schemaPathParams(ScanPath);
    const scope = yield* HttpServerRequest.schemaSearchParams(ScanScope);
    const scan = yield* getGeoAdhocScan(scope, scanId);
    return HttpServerResponse.jsonUnsafe(scan);
  }).pipe(
    Effect.catchTags({
      SchemaError: (error) =>
        Effect.succeed(failure(400, "invalid_request", error.message)),
      GeoAdhocScanNotFoundError: () =>
        Effect.succeed(failure(404, "scan_not_found", "Scan not found")),
      GeoProjectNotFoundError: () =>
        Effect.succeed(failure(404, "project_not_found", "Project not found")),
      GeoSettingsMissingError: () =>
        Effect.succeed(
          failure(
            404,
            "project_not_found",
            "GEO is not set up for this project"
          )
        ),
    })
  )
);

// The queue is resolved once while the router is built, so every request
// shares the same workers.
export const routes = HttpRouter.use((router) =>
  Effect.gen(function* () {
    const queue = yield* RunQueue;
    yield* router.add(
      "GET",
      "/health",
      HttpServerResponse.jsonUnsafe({ ok: true })
    );
    yield* router.add("POST", "/scans", createScan(queue));
    yield* router.add("POST", "/scans/:scanId/run", runScan(queue));
    yield* router.add("GET", "/scans/:scanId", getScan);
  })
);
