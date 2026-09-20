export const FAQ_ASSISTANT_ENDPOINT = "/api/faq-assistant";

// Small non-reasoning model: grounded single-turn Q&A, fast first token.
export const FAQ_ASSISTANT_MODEL_ID = "google/gemini-2.5-flash-lite";
export const FAQ_ASSISTANT_GUARD_MODEL_ID = "typesafe-ai/jev";

export const FAQ_ASSISTANT_QUESTION_MIN_LENGTH = 3;
export const FAQ_ASSISTANT_QUESTION_MAX_LENGTH = 240;
export const FAQ_ASSISTANT_MAX_OUTPUT_TOKENS = 320;
export const FAQ_ASSISTANT_GUARD_TIMEOUT_MS = 4000;
export const FAQ_ASSISTANT_ANSWER_TIMEOUT_MS = 20_000;
export const FAQ_ASSISTANT_GUARD_MIN_CONFIDENCE = 0.6;
export const FAQ_ASSISTANT_GUARD_STEERING_THRESHOLD = 0.4;

// The global caps are the hard cost ceiling: IP rotation cannot raise them.
export const FAQ_ASSISTANT_RATE_LIMITS = {
  ipMinute: { requests: 4, window: "1m" },
  ipDaily: { requests: 20, window: "1d" },
  globalHourly: { requests: 300, window: "1h" },
  globalDaily: { requests: 2000, window: "1d" },
} as const;

// Only these hosts become clickable in a rendered answer.
export const FAQ_ASSISTANT_LINK_HOSTS = [
  "usenotra.com",
  "www.usenotra.com",
  "app.usenotra.com",
  "docs.usenotra.com",
] as const;

export const FAQ_ASSISTANT_COPY = {
  label: "Ask anything else",
  placeholder: "Ask anything else",
  submit: "Ask",
  thinking: "Thinking…",
  disclaimer: "AI answer based on this site. It can be wrong.",
  offTopic:
    "I can only answer questions about Notra. For anything else, write to hello@usenotra.com.",
  rateLimited:
    "That was a lot of questions. Try again in a bit, or write to hello@usenotra.com.",
  unavailable:
    "I can't answer right now. Write to hello@usenotra.com and a human will.",
} as const;
