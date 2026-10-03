export interface ScheduledPublicationPost {
  contentType: string;
  title: string;
  slug: string | null;
  markdown: string | null;
  githubPublish: unknown;
}

export interface ScheduledPublicationWorkflowInput {
  scheduledPublicationId: string;
  claimToken: string;
}

export interface ScheduledPublicationSweepResult {
  claimed: number;
  started: number;
  released: number;
}
