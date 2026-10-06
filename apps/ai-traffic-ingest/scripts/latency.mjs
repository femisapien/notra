import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { connect, createServer } from "node:net";
import { fileURLToPath } from "node:url";

import { SQL } from "bun";

const databaseUrl = process.env.INGEST_BENCH_DATABASE_URL;
assert.ok(
  databaseUrl,
  "Set INGEST_BENCH_DATABASE_URL to an isolated local test database"
);
assert.ok(URL.canParse(databaseUrl), "Expected a valid benchmark database URL");
const database = new URL(databaseUrl);
const databaseHost = database.hostname === "[::1]" ? "::1" : database.hostname;
assert.ok(["postgres:", "postgresql:"].includes(database.protocol));
assert.ok(["127.0.0.1", "localhost", "::1"].includes(databaseHost));
assert.ok(
  !database.search && !database.hash,
  "Benchmark database URLs must not contain query parameters or fragments"
);
assert.equal(database.pathname, "/notra_ingest_bench");

const schema = Bun.spawn(
  [
    "psql",
    "-X",
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    fileURLToPath(new URL("latency-schema.sql", import.meta.url)),
  ],
  {
    env: {
      PATH: process.env.PATH,
      PGHOST: databaseHost,
      PGPORT: database.port || "5432",
      PGUSER: decodeURIComponent(database.username) || process.env.USER,
      PGPASSWORD: decodeURIComponent(database.password),
      PGDATABASE: "notra_ingest_bench",
    },
    stdout: "ignore",
    stderr: "inherit",
  }
);
assert.equal(await schema.exited, 0);
const sql = new SQL(databaseUrl);
const secret = "isolated-benchmark-signing-secret";
const payload = "bench_org.bench_project";
const token = `${payload}.${createHmac("sha256", secret).update(payload).digest("hex")}`;
const cache = new Map();
const commands = [];
const writes = [];
let redisDelayMs = 0;
let redisFail = false;
let tinybirdDelayMs = 0;
let connectionDelayMs = 0;
let databaseConnections = 0;
const databaseSockets = new Set();
const databaseProxy = createServer((client) => {
  databaseConnections += 1;
  databaseSockets.add(client);
  client.pause();
  const timer = setTimeout(() => {
    if (client.destroyed) {
      return;
    }
    const target = connect(Number(database.port || 5432), databaseHost);
    databaseSockets.add(target);
    target.on("error", () => client.destroy());
    target.on("close", () => {
      databaseSockets.delete(target);
      client.destroy();
    });
    client.on("close", () => target.destroy());
    client.pipe(target);
    target.pipe(client);
    client.resume();
  }, connectionDelayMs);
  client.on("error", () => client.destroy());
  client.on("close", () => {
    clearTimeout(timer);
    databaseSockets.delete(client);
  });
});
await new Promise((resolve) => databaseProxy.listen(0, "127.0.0.1", resolve));
const serviceDatabase = new URL(databaseUrl);
serviceDatabase.hostname = "127.0.0.1";
serviceDatabase.port = String(databaseProxy.address().port);

const upstream = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/v0/events")) {
      const rows = (await request.text())
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((row) => JSON.parse(row));
      for (const row of rows) {
        assert.equal(row.organization_id, "bench_org");
        assert.equal(row.project_id, "bench_project");
      }
      writes.push(rows.length);
      await Bun.sleep(tinybirdDelayMs);
      return Response.json({
        successful_rows: rows.length,
        quarantined_rows: 0,
      });
    }
    const body = await request.json();
    const pipeline = url.pathname.endsWith("/pipeline");
    const results = [];
    for (const command of pipeline ? body : [body]) {
      const [name, key, value] = command;
      const serialized = JSON.stringify(command);
      if (
        serialized.includes("ratelimit:geo-ingest") ||
        serialized.includes("geo:ingest-hosts:")
      ) {
        commands.push(String(name).toUpperCase());
      }
      let result = null;
      switch (String(name).toUpperCase()) {
        case "EVAL":
        case "EVALSHA":
          result = [999, 1000];
          break;
        case "GET":
          result = cache.get(key) ?? null;
          break;
        case "SET":
          result = command.includes("nx") && cache.has(key) ? null : "OK";
          if (result) {
            cache.set(key, value);
          }
          break;
        case "EXISTS":
          result = 0;
          break;
        case "PING":
          result = "PONG";
          break;
        default:
          throw new Error(`Unsupported fixture command: ${name}`);
      }
      results.push({ result });
    }
    await Bun.sleep(redisDelayMs);
    if (redisFail) {
      return Response.json({ error: "Injected Redis outage" }, { status: 503 });
    }
    return Response.json(pipeline ? results : results[0]);
  },
});

async function startService(flushIntervalMs = Date.now() + 3_600_000) {
  const child = Bun.spawn(
    [
      process.execPath,
      "--no-env-file",
      process.argv[2] ??
        fileURLToPath(new URL("../dist/index.js", import.meta.url)),
    ],
    {
      env: {
        PATH: process.env.PATH,
        NODE_ENV: "production",
        PORT: "0",
        GEO_INGEST_HOST: "127.0.0.1",
        DATABASE_URL: serviceDatabase.toString(),
        GEO_INGEST_SECRET: secret,
        UPSTASH_REDIS_REST_URL: `http://127.0.0.1:${upstream.port}`,
        UPSTASH_REDIS_REST_TOKEN: "isolated-benchmark",
        TINYBIRD_BASE_URL: `http://127.0.0.1:${upstream.port}`,
        TINYBIRD_TOKEN: "isolated-benchmark",
        GEO_INGEST_FLUSH_INTERVAL_MS: String(flushIntervalMs),
      },
      stdout: "pipe",
      stderr: "pipe",
    }
  );
  const logs = [];
  const errors = new Response(child.stderr).text();
  const reader = child.stdout.getReader();
  let output = "";
  let resolveReady;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });
  const reading = (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const text = new TextDecoder().decode(value);
      logs.push(text);
      output += text;
      const match = output.match(/Listening on port (\d+)/);
      if (match) {
        assert.ok(output.includes(`Listening on port ${match[1]} (127.0.0.1)`));
        resolveReady(`http://127.0.0.1:${match[1]}`);
      }
    }
  })();
  let timer;
  try {
    const url = await Promise.race([
      ready,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Service did not start")),
          10_000
        );
      }),
    ]);
    return {
      url,
      async stop() {
        child.kill("SIGTERM");
        assert.equal(await child.exited, 0, await errors);
        await reading;
        return logs.join("");
      },
    };
  } catch (error) {
    child.kill("SIGKILL");
    await child.exited;
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function measure(
  service,
  name,
  {
    count = 100,
    concurrency = 1,
    human = false,
    expectedStatus = 202,
    trackedEvery = 0,
  } = {}
) {
  const elapsed = [];
  const statuses = {};
  const startCommands = commands.length;
  const startWrites = writes.length;
  const startConnections = databaseConnections;
  let next = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < count) {
        const requestNumber = next++;
        const start = performance.now();
        const response = await fetch(`${service.url}/api/geo/ingest`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            method: "GET",
            url: "https://example.test/bench",
            userAgent: (
              trackedEvery > 0 ? requestNumber % trackedEvery !== 0 : human
            )
              ? "Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36"
              : "GPTBot",
          }),
          signal: AbortSignal.timeout(15_000),
        });
        await response.text();
        elapsed.push(performance.now() - start);
        statuses[response.status] = (statuses[response.status] ?? 0) + 1;
        assert.equal(response.status, expectedStatus, name);
      }
    })
  );
  elapsed.sort((a, b) => a - b);
  const percentile = (p) =>
    Number(elapsed[Math.ceil(elapsed.length * p) - 1].toFixed(2));
  const result = {
    name,
    count,
    concurrency,
    trackedRequests: human ? 0 : Math.ceil(count / (trackedEvery || 1)),
    p50Ms: percentile(0.5),
    p95Ms: percentile(0.95),
    p99Ms: percentile(0.99),
    maxMs: elapsed.at(-1),
    statuses,
    redisCommands: commands.length - startCommands,
    tinybirdWrites: writes.length - startWrites,
    databaseConnections: databaseConnections - startConnections,
  };
  console.log(JSON.stringify(result));
  return result;
}

const results = [];
let service;
let serviceLogs = "";
try {
  service = await startService();
  results.push(
    await measure(service, "human_zero_io", {
      count: 300,
      concurrency: 16,
      human: true,
    })
  );
  assert.equal(commands.length, 0);
  assert.equal(writes.length, 0);
  assert.equal(databaseConnections, 0);
  results.push(await measure(service, "ai_warm", { count: 200 }));
  results.push(
    await measure(service, "ai_burst", { count: 300, concurrency: 32 })
  );
  assert.equal(writes.length, 0);
  await Bun.sleep(11_000);
  results.push(await measure(service, "ai_after_pool_idle", { count: 1 }));
  assert.equal(results.at(-1).databaseConnections, 0);
  connectionDelayMs = 600;
  await Bun.sleep(11_000);
  results.push(
    await measure(service, "retained_pool_with_slow_new_connections", {
      count: 1,
    })
  );
  assert.equal(results.at(-1).databaseConnections, 0);
  results.push(await measure(service, "warm_pool_followup", { count: 20 }));
  assert.equal(results.at(-1).databaseConnections, 0);
  connectionDelayMs = 0;
  redisDelayMs = 200;
  results.push(await measure(service, "redis_200ms_each_hop", { count: 10 }));
  results.push(
    await measure(service, "mixed_98pct_human_redis_200ms", {
      count: 200,
      trackedEvery: 50,
    })
  );
  results.push(
    await measure(service, "human_with_slow_redis", { count: 100, human: true })
  );
  assert.equal(results.at(-1).redisCommands, 0);
  cache.clear();
  results.push(
    await measure(service, "host_cache_miss_redis_200ms", { count: 1 })
  );
  redisDelayMs = 0;
  await sql`UPDATE latency_control SET delay_ms = 600 WHERE id = 1`;
  results.push(await measure(service, "database_600ms", { count: 10 }));
  results.push(
    await measure(service, "database_600ms_pool_queue", {
      count: 32,
      concurrency: 32,
    })
  );
  await sql`UPDATE latency_control SET delay_ms = 0, generation = 2 WHERE id = 1`;
  results.push(
    await measure(service, "revoked_ai", { count: 5, expectedStatus: 401 })
  );
  await sql`UPDATE latency_control SET generation = 1 WHERE id = 1`;
  redisDelayMs = 1200;
  results.push(
    await measure(service, "redis_limiter_timeout", {
      count: 3,
      expectedStatus: 502,
    })
  );
  redisDelayMs = 0;
  redisFail = true;
  results.push(
    await measure(service, "human_with_redis_outage", {
      count: 100,
      human: true,
    })
  );
  results.push(
    await measure(service, "redis_transport_failure", {
      count: 3,
      expectedStatus: 502,
    })
  );
  redisFail = false;
  assert.equal(writes.length, 0);
  serviceLogs += await service.stop();
  service = undefined;
  assert.equal(
    writes.reduce((total, rows) => total + rows, 0),
    results.reduce(
      (total, result) =>
        total + (result.statuses[202] ? result.trackedRequests : 0),
      0
    ),
    "Every accepted tracked row must flush on shutdown"
  );
  service = await startService(0);
  tinybirdDelayMs = 600;
  results.push(
    await measure(service, "unbuffered_tinybird_600ms", { count: 10 })
  );
  assert.equal(results.at(-1).tinybirdWrites, 10);
  serviceLogs += await service.stop();
  service = undefined;
  const ingestLogs = serviceLogs
    .split("\n")
    .filter((line) => line.startsWith("{"))
    .map((line) => JSON.parse(line))
    .filter((event) => event.event === "geo.ingest");
  for (const event of ingestLogs.filter(
    (event) => event.outcome === "ingested"
  )) {
    for (const stage of [
      "payloadMs",
      "admissionMs",
      "identityMs",
      "hostsMs",
      "rateLimitMs",
    ]) {
      assert.equal(typeof event[stage], "number");
    }
  }
  assert.ok(
    ingestLogs.some((event) => event.identityMs >= 500 && event.ingestMs === 0)
  );
  assert.ok(
    ingestLogs.some(
      (event) =>
        event.admissionMs >= 190 &&
        event.hostsMs >= 190 &&
        event.rateLimitMs >= 190
    )
  );
  await Bun.write(
    process.env.INGEST_BENCH_LOGS ?? "latency-service.log",
    serviceLogs
  );
  await Bun.write(
    process.env.INGEST_BENCH_OUTPUT ?? "latency-results.json",
    JSON.stringify(
      {
        runtime: Bun.version,
        results,
        note: "Injected upstream delays in an isolated fixture; not production measurements.",
      },
      null,
      2
    )
  );
} finally {
  redisDelayMs = 0;
  redisFail = false;
  tinybirdDelayMs = 0;
  connectionDelayMs = 0;
  if (service) {
    await service.stop();
  }
  upstream.stop(true);
  for (const socket of databaseSockets) {
    socket.destroy();
  }
  await new Promise((resolve) => databaseProxy.close(resolve));
  await sql.close();
}
