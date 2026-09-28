"use client";

import { cn } from "cn";
import { useEffect, useRef } from "react";

import type { ChatBlockProps } from "../../types/chat-block";
import { PerplexityActions } from "../perplexity/perplexity-actions";
import { PerplexityComposer } from "../perplexity/perplexity-composer";
import { PerplexityMessage } from "../perplexity/perplexity-message";

export function PerplexityChatBlock({
  messages,
  onSend,
  onStop,
  busy = false,
  autoScroll = false,
  className,
}: ChatBlockProps & { autoScroll?: boolean }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollerRef.current) {
      scrollerRef.current.scrollTo({
        top: scrollerRef.current.scrollHeight,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    }
  }, [autoScroll, messages]);

  useEffect(() => {
    if (!autoScroll && scrollerRef.current) {
      scrollerRef.current.scrollTop = 0;
    }
  }, [autoScroll]);

  return (
    <section
      aria-label="Perplexity conversation"
      className={cn(
        "flex h-[36rem] min-h-0 w-full flex-col overflow-hidden bg-white dark:bg-[#191919]",
        className
      )}
    >
      <div
        aria-live="polite"
        className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable_both-edges]"
        ref={scrollerRef}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
          {messages.map((message) => (
            <PerplexityMessage
              key={message.id}
              from={message.from}
              search={message.search}
              actions={
                message.from === "assistant" && message.text ? (
                  <PerplexityActions text={message.text} />
                ) : undefined
              }
            >
              {message.content}
            </PerplexityMessage>
          ))}
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <PerplexityComposer busy={busy} onSend={onSend} onStop={onStop} />
      </div>
    </section>
  );
}
