import type {
  GeoTrafficEventRow,
  WebPageViewRow,
} from "@notra/analytics/tinybird/datasources";
import type { GeoRequestPayload } from "@usenotra/geo";
import type { z } from "zod";

import type { geoRequestPayloadSchema } from "../schemas/geo";
import type { GeoIngestIdentity, GeoVisitorType } from "./geo";

export type GeoIngestDefer = (task: () => Promise<void>) => void;

/** Write buffer between the ingest pipeline and Tinybird. */
export interface GeoIngestBuffer {
  /**
   * Returns false when the buffer cannot take the event, in which case the
   * pipeline writes it to Tinybird directly.
   */
  enqueue: (event: GeoTrafficEventRow) => boolean;
  /** The same for human page views (web_page_views); absent buffers write directly. */
  enqueueWeb?: (row: WebPageViewRow) => boolean;
  /** Writes an organization's buffered events now, for open live views. */
  expedite: (organizationId: string) => void;
}

export interface GeoIngestAnalyticsInput {
  identity: GeoIngestIdentity;
  event: GeoTrafficEventRow;
}

export interface GeoVisitorSignals {
  clientHints: boolean;
  fetchMode: string | null;
  tracing: boolean;
}

export interface GeoVisitorInput {
  userAgent: string | undefined;
  referer: string | undefined;
  accept: string | undefined;
  signals?: GeoVisitorSignals;
}

export interface GeoVisitorClassification {
  visitorType: GeoVisitorType;
  source: string;
  agent: string;
  category: string;
  confidence: string;
}

export interface GeoJourneyInput {
  url: URL;
  source: string;
  ip: string | undefined;
  capturedAt: Date;
  visitorType: GeoVisitorType;
  category: string;
}

export interface GeoJourneyTuning {
  bucketSeconds: number;
  fullIp: boolean;
}

export interface GeoTrafficEventInput {
  organizationId: string;
  projectId: string | null;
  payload: GeoRequestPayload;
  url: URL;
  capturedAt: Date;
  classification: GeoVisitorClassification;
  journey: GeoJourneyResolution;
}

export interface GeoJourneyResolution {
  journeyId: string;
  path: string;
}

/** `site`: a Notra Site serves this page and reports it itself. */
export type GeoIngestDropReason =
  | "visitor_type"
  | "host"
  | "site"
  | "web_rate_limited";

export type GeoIngestResult =
  | {
      outcome: "ingested";
      organizationId: string;
      projectId: string | null;
      visitorType: GeoVisitorType;
      source: string;
      agent: string;
      ingestMs: number;
    }
  | {
      outcome: "dropped";
      reason: GeoIngestDropReason;
      organizationId: string;
      projectId: string | null;
      visitorType: GeoVisitorType;
      host?: string;
    };

export type GeoIngestRuntime = "railway" | "vercel" | "local";

/** What the batcher needs from a row: the organization it expedites for live views. */
export interface BatchedRow {
  organization_id: string;
}

/** The request envelope as ingest validated it; newer than the published SDK types. */
export type GeoIngestPayload = z.infer<typeof geoRequestPayloadSchema>;

export interface WebPageViewInput {
  identity: GeoIngestIdentity;
  payload: GeoIngestPayload;
  url: URL;
  capturedAt: Date;
  classification: GeoVisitorClassification;
}

export interface WebReferrer {
  host: string;
  /** search, ai, social, internal, other or direct */
  group: string;
  source: string;
  aiProduct: string;
}

export interface WebSession {
  id: string;
  /** 1 for the first page of a session; 0 when there is no session store. */
  index: number;
  /** Where the session came from (referrer source or campaign); a different one starts a new session. */
  origin?: string;
}
