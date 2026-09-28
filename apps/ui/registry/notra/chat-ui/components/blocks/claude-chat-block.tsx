"use client";

import { cn } from "cn";

import type { ChatBlockProps } from "../../types/chat-block";
import { ClaudeChatActions } from "../claude-chat/claude-chat-actions";
import { ClaudeChatComposer } from "../claude-chat/claude-chat-composer";
import { ClaudeChatMessage } from "../claude-chat/claude-chat-message";

export function ClaudeChatBlock({
  messages,
  onSend,
  onStop,
  busy = false,
  className,
}: ChatBlockProps) {
  return (
    <section
      aria-label="Claude conversation"
      className={cn(
        "flex h-[36rem] min-h-0 flex-col overflow-hidden bg-[#faf9f6] dark:bg-[#25241f]",
        className
      )}
    >
      <div aria-live="polite" className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 py-8">
          {messages.map((message) => (
            <ClaudeChatMessage
              key={message.id}
              from={message.from}
              search={message.search}
              sources={message.sources}
              actions={
                message.from === "assistant" && message.text ? (
                  <ClaudeChatActions text={message.text} />
                ) : undefined
              }
            >
              {message.content}
            </ClaudeChatMessage>
          ))}
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <ClaudeChatComposer busy={busy} onSend={onSend} onStop={onStop} />
      </div>
    </section>
  );
}
