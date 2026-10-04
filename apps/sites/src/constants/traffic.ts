/** Responses worth reporting: pages, Markdown twins, llms.txt and robots.txt. */
export const TRAFFIC_CONTENT_TYPES = [
  "text/html",
  "text/markdown",
  "text/plain",
];

/** Ingest answers within this or the report is given up; it never delays a response. */
export const TRAFFIC_REPORT_TIMEOUT_MS = 2000;

/** Distributed tracing headers hint at programmatic clients. */
export const TRAFFIC_TRACING_HEADERS = ["traceparent", "b3", "x-b3-traceid"];
