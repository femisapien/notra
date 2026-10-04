import type { Site } from "./sites";

export interface PreviewAccessUrlParams {
  site: Pick<Site, "id" | "slug">;
  previewKey: string;
  next?: string;
  kind: "member" | "share";
  /** The member the session is for, or who created the share link. */
  userId: string;
}

export interface PreviewAccessUrl {
  url: string;
  expiresAt: Date;
}
