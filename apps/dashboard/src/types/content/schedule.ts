import type { PostSchedule } from "@notra/schemas/dashboard/content-calendar";

export interface ScheduleContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationSlug: string;
  contentId: string;
  contentType: string;
  title: string;
  schedule: PostSchedule | null;
  /** Day to prefill when there is no schedule yet (calendar drop). */
  initialDate?: Date;
}

export interface ContentScheduleButtonProps {
  organizationId: string;
  organizationSlug: string;
  contentId: string;
  contentType: string;
  title: string;
  disabled?: boolean;
  disabledReason?: string;
  /** A published post only shows the button while a schedule needs it. */
  published?: boolean;
}

export interface ScheduleDestinationStatusListProps {
  contentId: string;
  organizationId: string;
  schedule: PostSchedule;
}
