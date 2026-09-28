"use client";

import { useState } from "react";

import { OpencodeBlock } from "../components/blocks/opencode-block";
import { OpencodeStartBlock } from "../components/blocks/opencode-start-block";
import { OpencodeMessage } from "../components/opencode/opencode-message";
import type { OpencodeModelOption } from "../types/brainless-opencode";

export default function OpencodeStartPreview() {
  const [prompts, setPrompts] = useState<{ id: string; text: string }[]>([]);
  const [agent, setAgent] = useState("Build");
  const [model, setModel] = useState<OpencodeModelOption>({
    id: "muse-spark-1.3",
    label: "Muse Spark 1.3 Free",
    provider: "OpenCode Zen",
  });
  const [effort, setEffort] = useState("xhigh");

  const send = (text: string) =>
    setPrompts((current) => [...current, { id: crypto.randomUUID(), text }]);

  return (
    <div className="w-full">
      {prompts.length === 0 ? (
        <OpencodeStartBlock
          agent={agent}
          cwd="~/coding/notra-real:main"
          effort={effort}
          model={model.label}
          onAgentChange={setAgent}
          onEffortChange={setEffort}
          onModelChange={setModel}
          onSend={send}
          provider={model.provider}
          version="1.18.3"
        />
      ) : (
        <OpencodeBlock
          agent={agent}
          className="h-[36rem] overflow-hidden"
          cwd="~/coding/notra-real:main"
          effort={effort}
          model={model.label}
          onAgentChange={setAgent}
          onEffortChange={setEffort}
          onModelChange={setModel}
          onSend={send}
          provider={model.provider}
        >
          {prompts.map((prompt) => (
            <OpencodeMessage from="user" key={prompt.id}>
              {prompt.text}
            </OpencodeMessage>
          ))}
        </OpencodeBlock>
      )}
    </div>
  );
}
