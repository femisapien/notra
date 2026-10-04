import type { SiteServingState } from "@notra/sites-core/types/deployment";

import type { SitesDeps } from "./worker";

/** A request to a preview host, after the host and serving state resolved. */
export interface PreviewRequestContext {
  deps: SitesDeps;
  request: Request;
  url: URL;
  /** `http(s)://host[:port]` the visitor sees. */
  origin: string;
  state: SiteServingState;
  siteId: string;
  previewKey: string;
}
