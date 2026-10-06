/** A passage the user selected in a previewed post, sent as agent context. */
export interface ChatAnnotation {
  id: string;
  postId: string;
  title: string;
  text: string;
  /** What should change in the passage; empty keeps it a plain reference. */
  note?: string;
}

export interface ParsedChatAnnotations {
  annotations: Omit<ChatAnnotation, "id">[];
  /** The message text after the annotations block. */
  rest: string;
}
