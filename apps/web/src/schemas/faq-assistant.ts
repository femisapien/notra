import { z } from "zod";

import {
  FAQ_ASSISTANT_QUESTION_MAX_LENGTH,
  FAQ_ASSISTANT_QUESTION_MIN_LENGTH,
} from "@/constants/landing/faq-assistant";

const CONTROL_CHARACTERS = /\p{Cc}+/gu;
const WHITESPACE_RUNS = /\s+/g;

// Single turn by design: no history field, so there is no conversation to poison.
export const faqAssistantRequestSchema = z.strictObject({
  question: z
    .string()
    .max(FAQ_ASSISTANT_QUESTION_MAX_LENGTH * 4)
    .transform((value) =>
      value
        .replace(CONTROL_CHARACTERS, " ")
        .replace(WHITESPACE_RUNS, " ")
        .trim()
    )
    .pipe(
      z
        .string()
        .min(FAQ_ASSISTANT_QUESTION_MIN_LENGTH)
        .max(FAQ_ASSISTANT_QUESTION_MAX_LENGTH)
    ),
});
