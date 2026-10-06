import type { Dispatch, SetStateAction, ReactNode } from "react";

export interface ChatQuoteProviderProps {
  children: ReactNode;
  conversationId?: string | null;
}

export interface ChatQuotePreviewProps {
  disabled?: boolean;
}

/** A saved post the quoted text came from, e.g. the chat's preview panel. */
export interface ChatQuotePost {
  postId: string;
  title: string;
}

export interface ChatQuoteContextValue {
  scopeId: string;
  quote: string | null;
  setQuote: Dispatch<SetStateAction<string | null>>;
  /** Set when a quote comes from a post; the composer tags it and clears it. */
  quotedPost: ChatQuotePost | null;
  setQuotedPost: Dispatch<SetStateAction<ChatQuotePost | null>>;
}

export interface ChatQuoteSelection {
  text: string;
  rect: DOMRect;
  post?: ChatQuotePost;
}
