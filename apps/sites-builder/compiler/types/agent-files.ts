/** Written by the theme's `notra-pages.json` endpoint for every area build. */
export interface AreaPages {
  area: "blog" | "changelog";
  title: string;
  description?: string;
  indexPath: string;
  entries: Array<{
    path: string;
    title: string;
    description?: string;
    /** First paragraph of the body, for listings when there is no description. */
    summary?: string;
    date: string;
    updated?: string;
    authors?: string[];
    version?: string;
    tags: string[];
    indexable: boolean;
  }>;
}

export type AreaPageEntry = AreaPages["entries"][number];

/** https://llmstxt.org input: one site, or one mounted area of it. */
export interface LlmsTxtParams {
  name: string;
  description?: string;
  areas: AreaPages[];
  origin: string;
  fullTextPath: string;
  /** notra.json `markdown.instructions`, normalized to a list. */
  instructions: readonly string[];
}

export interface WriteAgentFilesParams {
  outDir: string;
  origin: string;
  siteName: string;
  siteDescription?: string;
  areas: AreaPages[];
  pageHtml: ReadonlyMap<string, string>;
  /** notra.json `markdown.instructions`, normalized to a list. */
  instructions: readonly string[];
}
