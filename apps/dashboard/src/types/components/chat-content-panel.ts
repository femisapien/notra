import type { ChatPostEntry } from "@/types/chat-posts";

export interface ChatContentPanelProps {
  /** Tool call ids of the open tabs, in tab order. */
  openToolCallIds: string[];
  activeToolCallId: string | null;
  onAskForChanges: (post: ChatPostEntry & { postId: string }) => void;
  onActivateTab: (toolCallId: string) => void;
  onCloseTab: (toolCallId: string) => void;
  onOpenTab: (toolCallId: string) => void;
  organizationId: string;
  organizationSlug: string;
  posts: ChatPostEntry[];
}

export interface ChatContentPanelTabProps {
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
  post: ChatPostEntry;
}

export interface ChatContentPanelDocumentProps {
  onAskForChanges: ChatContentPanelProps["onAskForChanges"];
  organizationId: string;
  organizationSlug: string;
  post: ChatPostEntry;
}
