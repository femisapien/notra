export const WEB_TREND_PEOPLE_KEY = "people";
export const WEB_TREND_AGENTS_KEY = "agents";

/** Rows per breakdown list before it stops; the rest is noise at this size. */
export const WEB_LIST_LIMIT = 8;

/** Compact rows: these tables sit side by side under the traffic chart. */
export const WEB_TABLE_ROW_HEIGHT = 44;
/** Empty and short tables keep this many rows of height. */
export const WEB_TABLE_MIN_ROWS = 3;

/** Display names for referrer sources ingest stores lower-case. */
export const WEB_SOURCE_LABELS: Record<string, string> = {
  google: "Google",
  bing: "Bing",
  duckduckgo: "DuckDuckGo",
  yahoo: "Yahoo",
  ecosia: "Ecosia",
  brave: "Brave Search",
  kagi: "Kagi",
  yandex: "Yandex",
  baidu: "Baidu",
  startpage: "Startpage",
  qwant: "Qwant",
  x: "X",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  reddit: "Reddit",
  "hacker-news": "Hacker News",
  youtube: "YouTube",
  threads: "Threads",
  bluesky: "Bluesky",
  mastodon: "Mastodon",
  github: "GitHub",
  "product-hunt": "Product Hunt",
  medium: "Medium",
  substack: "Substack",
};
