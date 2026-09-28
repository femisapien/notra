"use client";

import { useState } from "react";

import { OpencodeBlock } from "../components/blocks/opencode-block";
import { OpencodeActivity } from "../components/opencode/opencode-activity";
import { OpencodeMessage } from "../components/opencode/opencode-message";
import { OpencodeSources } from "../components/opencode/opencode-sources";
import {
  OPENCODE_STORY_SESSION,
  OPENCODE_STORY_SOURCES,
} from "../constants/opencode-story";

export default function OpencodePreview() {
  const session = OPENCODE_STORY_SESSION;
  const [sentMessages, setSentMessages] = useState<
    { id: string; text: string }[]
  >([]);

  return (
    <div className="w-full">
      <OpencodeBlock
        className="h-[36rem] overflow-hidden"
        context={session.context}
        cwd={session.cwd}
        onSend={(text) =>
          setSentMessages((current) => [
            ...current,
            { id: crypto.randomUUID(), text },
          ])
        }
        placeholder={session.promptPlaceholder}
        sidebar={{
          title: session.title,
          tokens: session.tokens,
          used: session.used,
          servers: session.servers,
        }}
      >
        <OpencodeMessage from="user">{session.userMessage}</OpencodeMessage>
        {session.activities.slice(0, 1).map((activity) => (
          <OpencodeActivity key={activity.id} {...activity} />
        ))}
        <OpencodeMessage>{session.assistantMessage}</OpencodeMessage>
        <div className="space-y-2.5">
          {session.activities.slice(1).map((activity) => (
            <OpencodeActivity key={activity.id} {...activity} />
          ))}
        </div>
        <OpencodeSources sources={OPENCODE_STORY_SOURCES} />
        <OpencodeMessage>{session.resultMessage}</OpencodeMessage>
        {sentMessages.map((message) => (
          <OpencodeMessage from="user" key={message.id}>
            {message.text}
          </OpencodeMessage>
        ))}
      </OpencodeBlock>
    </div>
  );
}
