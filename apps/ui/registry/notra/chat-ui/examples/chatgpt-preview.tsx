"use client";

import { useState } from "react";

import { ChatgptBlock } from "../components/blocks/chatgpt-block";
import type { ChatBlockMessage } from "../types/chat-block";

const initialMessages: ChatBlockMessage[] = [
  {
    id: "question",
    from: "user",
    content: "Can you break down a responsive chat layout?",
  },
  {
    id: "answer",
    from: "assistant",
    content: (
      <div className="space-y-3">
        <p>Yes. I would build it in three passes:</p>
        <ol className="list-inside list-decimal space-y-1">
          <li>Make the conversation area scroll independently.</li>
          <li>Keep the composer visible at the bottom.</li>
          <li>Check long text and controls on a 320 px viewport.</li>
        </ol>
      </div>
    ),
    text: "Yes. I would build it in three passes: 1. Make the conversation area scroll independently. 2. Keep the composer visible at the bottom. 3. Check long text and controls on a 320 px viewport.",
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
