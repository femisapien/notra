"use client";

import { cn } from "cn";

import type { ChatgptBlockProps } from "../../types/chatgpt";
import { ChatgptActions } from "../chatgpt/chatgpt-actions";
import { ChatgptComposer } from "../chatgpt/chatgpt-composer";
import { ChatgptMessage } from "../chatgpt/chatgpt-message";

export function ChatgptBlock({
  messages,
  onSend,
  onStop,
  onAdd,
  onShareMessage,
  onRedoMessage,
  onMoreMessage,
  busy = false,
  className,
}: ChatgptBlockProps) {
  return (
    <section
      aria-label="ChatGPT conversation"
      className={cn(
        "bg-background flex h-[36rem] min-h-0 flex-col overflow-hidden",
        className
      )}
    >
      <div aria-live="polite" className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
          {messages.map((message) => (
            <ChatgptMessage
              key={message.id}
              from={message.from}
              reasoning={message.reasoning}
              tools={message.tools}
              actions={
                message.from === "assistant" && message.text ? (
                  <ChatgptActions
                    text={message.text}
                    onShare={
                      onShareMessage
                        ? () => onShareMessage(message.id)
                        : undefined
                    }
                    onRedo={
                      onRedoMessage
                        ? () => onRedoMessage(message.id)
                        : undefined
                    }
                    onMore={
                      onMoreMessage
                        ? () => onMoreMessage(message.id)
                        : undefined
                    }
                  />
                ) : undefined
              }
            >
              {message.content}
            </ChatgptMessage>
          ))}
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <ChatgptComposer
          busy={busy}
          onAdd={onAdd}
          onSend={onSend}
          onStop={onStop}
        />
      </div>
    </section>
  );
}
