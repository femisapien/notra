"use client";

import { useState } from "react";

import { GeminiChatBlock } from "../components/blocks/gemini-block";
import type { ChatBlockMessage } from "../types/chat-block";

const initialMessages: ChatBlockMessage[] = [
  {
    id: "question",
    from: "user",
    content: "How do I make this chat layout work on mobile?",
  },
  {
    id: "answer",
    from: "assistant",
    content: (
      <div className="space-y-3">
        <p>Start with the narrowest screen and build up:</p>
        <ol className="list-inside list-decimal space-y-1">
          <li>Keep the message column fluid and add a maximum width.</li>
          <li>Let long messages wrap without pushing the page sideways.</li>
          <li>Anchor the prompt to the bottom and test at 320 px.</li>
        </ol>
      </div>
    ),
    text: "Start with the narrowest screen and build up: 1. Keep the message column fluid and add a maximum width. 2. Let long messages wrap without pushing the page sideways. 3. Anchor the prompt to the bottom and test at 320 px.",
  },
];

export default function GeminiPreview() {
  const [messages, setMessages] = useState(initialMessages);
  return (
    <GeminiChatBlock
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
