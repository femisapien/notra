import type {
  SitePreviewPassword,
  SitePreviewPointer,
  SiteServingState,
} from "@notra/sites-core/types/deployment";

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

/** The site's preview access as the database has it; mirrored into every state write. */
export interface ServingPreviewAccess {
  previewPassword: SitePreviewPassword | null;
  previewVisibility: SitePreviewPointer["visibility"] | null;
}
