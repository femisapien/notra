import { proxyToNotra } from "../../lib/notra-proxy";

// Rendered on demand: every request is forwarded to Notra.
export const prerender = false;

// [...path] also matches the section root itself, without a trailing slash.
export const ALL = proxyToNotra;
