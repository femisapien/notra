"use client";

import { useState } from "react";

import { ChatgptBlock } from "../components/blocks/chatgpt-block";
import { ChatgptToolCall } from "../components/chatgpt/chatgpt-tool-call";
import type { ChatgptBlockMessage } from "../types/chatgpt";

const initialMessages: ChatgptBlockMessage[] = [
  {
    id: "question",
    from: "user",
    content: "Can you review our chat layout and suggest what to improve?",
  },
  {
    id: "answer",
    from: "assistant",
    tools: (
      <div className="w-full space-y-2">
        <ChatgptToolCall
          defaultOpen
          input="chatgpt-block.tsx"
          result="The message list scrolls above a composer that stays at the bottom."
          tool="Read file"
        />
        <ChatgptToolCall
          input="chatgpt-composer.tsx"
          result="The composer includes a message field, model selector, and send button. An attachment action can be wired through onAdd."
          tool="Read file"
        />
      </div>
    ),
    content: (
      <div className="space-y-3">
        <p>The basic structure is sound. I would refine it in three passes:</p>
        <ol className="list-inside list-decimal space-y-1">
          <li>
            Keep the scroll position stable while someone reads older messages.
          </li>
          <li>Give long answers headings and a readable line length.</li>
          <li>Check the composer with long text and a 320 px viewport.</li>
        </ol>
      </div>
    ),
    text: "The basic structure is sound. I would refine it in three passes: 1. Keep the scroll position stable while someone reads older messages. 2. Give long answers headings and a readable line length. 3. Check the composer with long text and a 320 px viewport.",
  },
];

export default function ChatgptPreview() {
  const [messages, setMessages] = useState(initialMessages);
  return (
    <ChatgptBlock
      messages={messages}
      onSend={(text) =>
        setMessages((current) => [
          ...current,
          { id: crypto.randomUUID(), from: "user", content: text },
        ])
      }
    />
  );
}
