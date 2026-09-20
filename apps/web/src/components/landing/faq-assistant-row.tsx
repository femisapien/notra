"use client";

import { cn } from "@notra/ui/lib/utils";
import { type FormEvent, useState } from "react";

import {
  FAQ_ASSISTANT_COPY,
  FAQ_ASSISTANT_QUESTION_MAX_LENGTH,
  FAQ_ASSISTANT_QUESTION_MIN_LENGTH,
} from "@/constants/landing/faq-assistant";
import { useFaqAssistant } from "@/lib/faq-assistant/use-faq-assistant";
import { splitFaqAnswer } from "@/utils/faq-answer-segments";

const INPUT_ID = "faq-assistant-input";

function AskIcon() {
  return (
    <svg
      aria-hidden="true"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3.5c.6 4.6 3.9 7.9 8.5 8.5-4.6.6-7.9 3.9-8.5 8.5-.6-4.6-3.9-7.9-8.5-8.5 4.6-.6 7.9-3.9 8.5-8.5Z"
        fill="none"
        stroke="#8B5CF6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SubmitArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 8h10M9 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function FaqAnswer({ text }: { text: string }) {
  return (
    <p className="font-sans text-base leading-6 tracking-[-0.01em] whitespace-pre-wrap text-[#1E1E1E99] dark:text-white/60">
      {splitFaqAnswer(text).map((segment, index) =>
        segment.type === "link" ? (
          <a
            className="text-[#1E1E1E] underline underline-offset-2 dark:text-white"
            href={segment.href}
            // Segments are positional slices of one streamed string.
            key={`${index}-${segment.href}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            {segment.value}
          </a>
        ) : (
          segment.value
        )
      )}
    </p>
  );
}

export function FaqAssistantRow() {
  const [question, setQuestion] = useState("");
  const { answer, ask, status } = useFaqAssistant();

  const trimmed = question.trim();
  const isBusy = status === "loading" || status === "streaming";
  const canSubmit =
    !isBusy && trimmed.length >= FAQ_ASSISTANT_QUESTION_MIN_LENGTH;
  const showPanel = status !== "idle";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSubmit) {
      ask(trimmed);
    }
  };

  return (
    <div className="flex flex-col border-y border-[#1E1E1E1F] py-7.5 dark:border-white/10">
      <form
        className="flex w-full items-center gap-4 sm:gap-8"
        onSubmit={handleSubmit}
      >
        <span className="flex shrink-0 items-center justify-center">
          <AskIcon />
        </span>
        <label className="sr-only" htmlFor={INPUT_ID}>
          {FAQ_ASSISTANT_COPY.label}
        </label>
        <input
          autoComplete="off"
          className="min-w-0 grow bg-transparent font-sans text-lg leading-7 font-medium tracking-[-0.01em] text-[#1E1E1E] outline-none placeholder:text-[#1E1E1E66] sm:text-xl sm:leading-[1.875rem] dark:text-white dark:placeholder:text-white/40"
          enterKeyHint="send"
          id={INPUT_ID}
          maxLength={FAQ_ASSISTANT_QUESTION_MAX_LENGTH}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={FAQ_ASSISTANT_COPY.placeholder}
          type="text"
          value={question}
        />
        <button
          aria-label={FAQ_ASSISTANT_COPY.submit}
          className={cn(
            "duration-slow flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#1E1E1E99] transition-colors ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5CF6] disabled:cursor-default motion-reduce:transition-none dark:text-white/60",
            canSubmit &&
              "bg-[#1E1E1E0F] text-[#1E1E1E] dark:bg-white/10 dark:text-white"
          )}
          disabled={!canSubmit}
          type="submit"
        >
          <SubmitArrowIcon />
        </button>
      </form>
      <div
        className={cn(
          "duration-slow grid transition-[grid-template-rows] ease-out motion-reduce:transition-none",
          showPanel ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div aria-live="polite" className="overflow-hidden">
          <div className="flex flex-col gap-3 pt-3.5">
            {status === "loading" ? (
              <p className="font-sans text-base leading-6 tracking-[-0.01em] text-[#1E1E1E66] motion-safe:animate-pulse dark:text-white/40">
                {FAQ_ASSISTANT_COPY.thinking}
              </p>
            ) : (
              <FaqAnswer text={answer} />
            )}
            {status === "done" ? (
              <p className="font-sans text-xs leading-4 text-[#1E1E1E66] dark:text-white/40">
                {FAQ_ASSISTANT_COPY.disclaimer}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
