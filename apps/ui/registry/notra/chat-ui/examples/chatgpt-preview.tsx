"use client";

import { useState } from "react";

import { ChatgptBlock } from "../components/blocks/chatgpt-block";
import { ChatgptActivity } from "../components/chatgpt/chatgpt-activity";
import { ChatgptReasoning } from "../components/chatgpt/chatgpt-reasoning";
import { ChatgptToolCall } from "../components/chatgpt/chatgpt-tool-call";
import type { ChatgptBlockMessage } from "../types/chatgpt";

const initialMessages: ChatgptBlockMessage[] = [
  {
    id: "question",
    from: "user",
    content: "Was waren die wichtigsten News am 17. August 2026?",
  },
  {
    id: "answer",
    from: "assistant",
    reasoning: (
      <ChatgptReasoning
        complete
        search={
          <ChatgptActivity
            seconds={21}
            sites={[
              { domain: "reuters.com", label: "www.reuters.com" },
              { domain: "theguardian.com", label: "www.theguardian.com" },
              { domain: "apnews.com", label: "apnews.com" },
              { domain: "bbc.com", label: "bbc.com" },
            ]}
            sourceCount={91}
            sources={[
              {
                id: "reuters",
                publisher: "Reuters",
                domain: "reuters.com",
                title: "G7 ministers weigh new sanctions as Geneva talks stall",
                snippet: "Foreign ministers discussed a coordinated package.",
                timeLabel: "17 Aug 2026",
              },
              {
                id: "ap",
                publisher: "AP News",
                domain: "apnews.com",
                title: "Ceasefire talks in Geneva hit another delay",
                snippet: "Negotiators left without a new timetable.",
                timeLabel: "17 Aug 2026",
              },
            ]}
            websites={6}
          />
        }
        seconds={21}
      >
        <div className="space-y-3">
          <p>
            Klar. Ich ziehe dir die wichtigsten News zusammen — mit Fokus auf
            Weltpolitik, Deutschland und Wirtschaft.
          </p>
          <div className="w-full space-y-2">
            <ChatgptToolCall
              input="G7 sanctions Ottawa Geneva talks"
              result="Reuters and AP News report on the G7 discussions and the delayed talks."
              tool="Web search"
            />
            <ChatgptToolCall
              input="Germany growth package and DAX"
              result="Spiegel and Financial Times cover the growth package and market opening."
              tool="Web search"
            />
          </div>
        </div>
      </ChatgptReasoning>
    ),
    content: (
      <div className="space-y-3">
        <p>
          Kurz der Stand von <strong>Montag, 17. August 2026</strong>:
        </p>
        <p>
          Die G7-Außenminister beraten in Ottawa über ein neues Sanktionspaket,
          während die Waffenruhe-Gespräche in Genf erneut stocken. In Berlin
          steht diese Woche das Wachstumspaket auf der Tagesordnung — die Union
          will Nachbesserungen.
        </p>
        <p>
          An den Märkten eröffnet der DAX fester, nachdem US-Tech überraschend
          starke Zahlen nachgelegt hat. Parallel zieht die Debatte um den
          AI-Act-Vollzug an.
        </p>
      </div>
    ),
    text: "Kurz der Stand von Montag, 17. August 2026: Die G7-Außenminister beraten in Ottawa über ein neues Sanktionspaket, während die Waffenruhe-Gespräche in Genf erneut stocken. In Berlin steht diese Woche das Wachstumspaket auf der Tagesordnung — die Union will Nachbesserungen. An den Märkten eröffnet der DAX fester, nachdem US-Tech überraschend starke Zahlen nachgelegt hat. Parallel zieht die Debatte um den AI-Act-Vollzug an.",
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
