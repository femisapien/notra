import { SITE_ASSETS_DIR } from "@notra/sites-core/constants/sites";

export const ASSET_SEGMENT = `/${SITE_ASSETS_DIR}/`;

/** Keys of the edge cache; never resolved, only used to name cached files. */
export const EDGE_CACHE_ORIGIN = "https://sites-cache.notra.internal";

export const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

/** AI crawlers and agents are named explicitly so a site's stance is unambiguous to them. */
export const AI_USER_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "MistralAI-User",
  "DuckAssistBot",
];
