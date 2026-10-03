import type {
  ScheduledPublicationDestination,
  ScheduledPublicationDestinationConfig,
  ScheduledPublicationResult,
  ScheduledPublicationStatus,
} from "@notra/db/types/scheduled-publications";

export type ScheduleDestination =
  | { destination: "github"; repositoryId: string; merge: boolean }
  | { destination: "social"; accountId: string };

export interface SchedulePostParams {
  organizationId: string;
  postId: string;
  scheduledAt: Date;
  timeZone: string;
  destinations: ScheduleDestination[];
  userId: string | null;
  /**
   * IDs of the pending rows the caller is replacing (empty for a post with no
   * schedule). When set, the call fails with `conflict` if the post's pending
   * or failed rows changed since the caller loaded them. Without it, failed
   * rows are superseded, except a social post that may already be live.
   */
  expectedScheduledIds?: string[];
  now?: Date;
}

export type SchedulePostFailureReason =
  | "post_not_found"
  | "invalid_time"
  | "destination_not_supported"
  | "repository_not_found"
  | "account_not_found"
  | "publishing_in_progress"
  | "unconfirmed_social_post"
  | "social_already_posted"
  | "conflict";

export type SchedulePostOutcome =
  | { ok: true; schedule: PostScheduleView }
  | { ok: false; reason: SchedulePostFailureReason };

export interface ScheduledPublicationView {
  id: string;
  destination: ScheduledPublicationDestination;
  status: ScheduledPublicationStatus;
  scheduledAt: string;
  timeZone: string;
  repositoryId: string | null;
  merge: boolean | null;
  accountId: string | null;
  attempts: number;
  errorCode: string | null;
  lastError: string | null;
  resultUrl: string | null;
  publishedAt: string | null;
}

export interface PostScheduleView {
  postId: string;
  scheduledAt: string;
  timeZone: string;
  publications: ScheduledPublicationView[];
}

export interface ScheduledPublicationRowForView {
  id: string;
  postId: string;
  destination: ScheduledPublicationDestination;
  destinationConfig: ScheduledPublicationDestinationConfig;
  status: ScheduledPublicationStatus;
  scheduledAt: Date;
  timeZone: string;
  attempts: number;
  errorCode: string | null;
  lastError: string | null;
  result: ScheduledPublicationResult | null;
  publishedAt: Date | null;
  createdAt: Date;
}

export interface ClaimedScheduledPublication {
  id: string;
  organizationId: string;
  postId: string;
  destination: ScheduledPublicationDestination;
  claimToken: string;
}

export interface ScheduledPublicationAttempt {
  id: string;
  organizationId: string;
  postId: string;
  destination: ScheduledPublicationDestination;
  destinationConfig: ScheduledPublicationDestinationConfig;
  scheduledAt: Date;
  attempts: number;
  externalAttemptAt: Date | null;
  cancelRequestedAt: Date | null;
  createdByUserId: string | null;
  createdAt: Date;
  /** What earlier attempts achieved, like a pull request already opened. */
  result: ScheduledPublicationResult | null;
}

export type ScheduledPublicationOutcome =
  | { kind: "published"; result: ScheduledPublicationResult }
  | {
      kind: "error";
      code: string;
      message: string;
      /** Worth another attempt after a back-off (transient upstream failure). */
      retryable: boolean;
      /** Anything the attempt achieved before failing, like an opened PR. */
      result?: ScheduledPublicationResult;
    };

export type ScheduledPublicationFinish =
  | "published"
  | "retry_scheduled"
  | "failed"
  | "canceled"
  | "superseded";

export interface CalendarPostView {
  id: string;
  title: string;
  contentType: string;
  status: "draft" | "published";
  publishedAt: string | null;
  updatedAt: string;
}

export type ContentCalendarEntryView =
  | { kind: "scheduled"; post: CalendarPostView; schedule: PostScheduleView }
  | { kind: "published"; post: CalendarPostView };
