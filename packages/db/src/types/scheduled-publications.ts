import type {
  SCHEDULED_PUBLICATION_DESTINATIONS,
  SCHEDULED_PUBLICATION_STATUSES,
} from "../constants/scheduled-publications";

export type ScheduledPublicationStatus =
  (typeof SCHEDULED_PUBLICATION_STATUSES)[number];

export type ScheduledPublicationDestination =
  (typeof SCHEDULED_PUBLICATION_DESTINATIONS)[number];

export type ScheduledPublicationDestinationConfig =
  | { destination: "notra" }
  | { destination: "github"; repositoryId: string; merge: boolean }
  | { destination: "social"; accountId: string };

export interface ScheduledPublicationResult {
  alreadyPublished?: boolean;
  /** The commit Notra pushed, so a retried merge never takes a later push. */
  headSha?: string | null;
  merged?: boolean;
  platformPostId?: string | null;
  postUrl?: string | null;
  pullRequestNumber?: number;
  pullRequestUrl?: string;
}
