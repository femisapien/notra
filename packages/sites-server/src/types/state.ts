import type { SiteServingState } from "@notra/sites-core/types/deployment";

/** The site fields the serving state is keyed and labelled by. */
export interface ServingSiteRef {
  id: string;
  slug: string;
}

export interface ServingStateObject {
  state: SiteServingState;
  etag: string;
}

export type ServingStateMutation<T> =
  | { write: SiteServingState; result: T }
  | { skip: true; result: T };
