"use client";

import { useState } from "react";

import { ClaudeChatBlock } from "../components/blocks/claude-chat-block";
import { ClaudeChatToolCall } from "../components/claude-chat/claude-chat-tool-call";
import type { ChatBlockMessage } from "../types/chat-block";

const initialMessages: ChatBlockMessage[] = [
  {
    id: "question",
    from: "user",
    content:
      "We're redesigning the chat in our product dashboard. How would you make a long conversation easier to read and use?",
  },
  {
    id: "answer",
    from: "assistant",
    tools: (
      <div className="w-full space-y-2">
        <ClaudeChatToolCall
          defaultOpen
          input="claude-chat-block.tsx"
          result="The message list scrolls independently; the composer stays below it."
          tool="Read file"
        />
        <ClaudeChatToolCall
          input="claude-chat-message.tsx"
          result="User prompts align right at up to 70% width. Assistant replies use the reading edge and serif type."
          tool="Read file"
        />
      </div>
    ),
    content: (
      <div className="space-y-4">
        <p>
          The current block already keeps the conversation separate from the
          composer. I would keep that structure and focus on the reading flow:
          people should always know which message they are in, what the
          assistant is doing, and where to reply.
        </p>
        <div>
          <p className="font-semibold">
            1. Give the conversation a clear rhythm
          </p>
          <p>
            Keep messages in one column with a comfortable line length. Align
            the user’s prompts to the right, leave assistant answers on the
            reading edge, and use spacing to separate turns. Long answers need
            headings, short paragraphs, and lists that can be scanned.
          </p>
        </div>
        <div>
          <p className="font-semibold">2. Make ongoing work understandable</p>
          <p>
            Show a compact activity state while a reply is being prepared. Keep
            the composer available, let people stop a response, and only scroll
            automatically when they are already near the bottom. If they scroll
            up to read, leave their position alone.
          </p>
        </div>
        <div>
          <p className="font-semibold">3. Check the difficult moments</p>
          <p>
            Test a very long answer, a failed reply, keyboard navigation, and
            the point where the composer grows to several lines. Those cases
            reveal whether the layout still feels stable.
          </p>
        </div>
      </div>
    ),
    text: "The current block already keeps the conversation separate from the composer. I would keep that structure and focus on the reading flow: people should always know which message they are in, what the assistant is doing, and where to reply. 1. Give the conversation a clear rhythm. Keep messages in one column with a comfortable line length. Align the user’s prompts to the right, leave assistant answers on the reading edge, and use spacing to separate turns. Long answers need headings, short paragraphs, and lists that can be scanned. 2. Make ongoing work understandable. Show a compact activity state while a reply is being prepared. Keep the composer available, let people stop a response, and only scroll automatically when they are already near the bottom. If they scroll up to read, leave their position alone. 3. Check the difficult moments. Test a very long answer, a failed reply, keyboard navigation, and the point where the composer grows to several lines. Those cases reveal whether the layout still feels stable.",
  },
  {
    id: "follow-up",
    from: "user",
    content: "And what would you change on a phone?",
  },
  {
    id: "mobile-answer",
    from: "assistant",
    content: (
      <div className="space-y-3">
        <p>
          Keep the same reading order, but let the conversation use the full
          screen width. Reduce side padding, keep controls within thumb reach,
          and allow the composer to grow without covering the latest message.
        </p>
        <p>
          I would test it at 320 px wide with the keyboard open, then send a
          multi-line prompt and scroll back through an older answer. That gives
          you a practical check of both the input and reading experience.
        </p>
      </div>
    ),
    text: "Keep the same reading order, but let the conversation use the full screen width. Reduce side padding, keep controls within thumb reach, and allow the composer to grow without covering the latest message. I would test it at 320 px wide with the keyboard open, then send a multi-line prompt and scroll back through an older answer. That gives you a practical check of both the input and reading experience.",
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
