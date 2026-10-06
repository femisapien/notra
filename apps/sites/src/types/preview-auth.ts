import type { SiteServingState } from "@notra/sites-core/types/deployment";

import type { SiteRequestContext } from "./serving";

/** A request to a preview host, after the host and serving state resolved. */
export interface PreviewRequestContext extends SiteRequestContext {
  state: SiteServingState;
  siteId: string;
  previewKey: string;
}
