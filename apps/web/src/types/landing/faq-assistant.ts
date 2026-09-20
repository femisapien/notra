export type FaqGuardVerdict = "allowed" | "rejected" | "unavailable";

export type FaqAssistantStatus = "idle" | "loading" | "streaming" | "done";

export type FaqAnswerSegment =
  | { type: "text"; value: string }
  | { type: "link"; value: string; href: string };
