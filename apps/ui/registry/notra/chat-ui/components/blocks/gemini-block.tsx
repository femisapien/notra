"use client";

import { cn } from "cn";

import type { ChatBlockProps } from "../../types/chat-block";
import { GeminiActions } from "../gemini/gemini-actions";
import { GeminiComposer } from "../gemini/gemini-composer";
import { GeminiMessage } from "../gemini/gemini-message";

export function GeminiChatBlock({
  messages,
  onSend,
  onStop,
  busy = false,
  className,
}: ChatBlockProps) {
  return (
    <section
      aria-label="Gemini conversation"
      className={cn(
        "flex h-[36rem] min-h-0 flex-col overflow-hidden bg-white dark:bg-[#1f1f1f]",
        className
      )}
    >
      <div aria-live="polite" className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
          {messages.map((message) => (
            <GeminiMessage
              key={message.id}
              from={message.from}
              status={message.status}
              actions={
                message.from === "assistant" && message.text ? (
                  <GeminiActions text={message.text} />
                ) : undefined
              }
            >
              {message.content}
            </GeminiMessage>
          ))}
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <GeminiComposer busy={busy} onSend={onSend} onStop={onStop} />
      </div>
    </section>
  );
}
