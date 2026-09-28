"use client";

import { useState } from "react";

import { ClaudeChatBlock } from "../components/blocks/claude-chat-block";
import type { ChatBlockMessage } from "../types/chat-block";

const initialMessages: ChatBlockMessage[] = [
  {
    id: "question",
    from: "user",
    content: "Help me plan a clearer chat interface.",
  },
  {
    id: "answer",
    from: "assistant",
    content: (
      <div className="space-y-3">
        <p>Here is a small plan you can check as you go:</p>
        <ol className="list-inside list-decimal space-y-1">
          <li>Separate the conversation from the input area.</li>
          <li>Give messages a readable line length and consistent spacing.</li>
          <li>Test keyboard focus, scrolling, and a narrow screen.</li>
        </ol>
      </div>
    ),
    text: "Here is a small plan you can check as you go: 1. Separate the conversation from the input area. 2. Give messages a readable line length and consistent spacing. 3. Test keyboard focus, scrolling, and a narrow screen.",
  },
];

export default function ClaudeChatPreview() {
  const [messages, setMessages] = useState(initialMessages);
  return (
    <ClaudeChatBlock
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
