"use client";

import { PlayIcon, StopIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";

import { PerplexityChatBlock } from "../components/blocks/perplexity-block";
import { PerplexityCitation } from "../components/perplexity/perplexity-citation";
import {
  PerplexityResearch,
  PerplexityResearchStep,
} from "../components/perplexity/perplexity-research";
import { PerplexitySearch } from "../components/perplexity/perplexity-search";
import {
  PERPLEXITY_THINKING_GAP_MS,
  PERPLEXITY_THINKING_MS,
  perplexitySearchDuration,
} from "../components/perplexity/perplexity-search-timing";
import { PerplexityThinking } from "../components/perplexity/perplexity-thinking";
import type { ChatBlockMessage } from "../types/chat-block";

const QUESTION = "wen hat notion gekauft, um notion mail zu bauen?";
const ANSWER =
  "Notion hat Skiff gekauft — das Team und die Technik hinter dem, was später Notion Mail wurde. Notion übernahm Skiff im Februar 2024 und integrierte das Team in seine eigene Mail-App.";
const QUERIES = [
  "Notion acquire company to make Notion Mail",
  "Skiff acquisition Notion 2024",
  "Notion Mail Skiff history",
];
const SOURCES = [
  {
    title: "Notion acquires Skiff to expand into email and calendar",
    domain: "techcrunch.com",
  },
  {
    title: "Encrypted productivity startup Skiff is being shut down",
    domain: "arstechnica.com",
  },
  {
    title: "Notion Mail launches as the successor to Skiff",
    domain: "theverge.com",
  },
  { title: "Notion buys Skiff in a push into email", domain: "bloomberg.com" },
];

function answerContent(showDetail: boolean) {
  return (
    <div className="space-y-4 font-serif">
      <p className="animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
        Notion hat <strong>Skiff</strong> gekauft — das Team und die Technik
        hinter dem, was später Notion Mail wurde.{" "}
        <PerplexityCitation domain="techcrunch.com" label="techcrunch" />
      </p>
      {showDetail ? (
        <p className="animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
          Notion übernahm Skiff im Februar 2024 und integrierte das Team in
          seine eigene Mail-App.{" "}
          <PerplexityCitation domain="theverge.com" label="theverge" />
        </p>
      ) : null}
    </div>
  );
}

function research(phase: "complete" | "web" | "review", reducedMotion = false) {
  const active = phase !== "complete";

  return (
    <PerplexityResearch
      defaultOpen={active}
      duration={active ? undefined : "1s"}
      key={active ? "running" : "complete"}
      status={active ? "researching" : "researched"}
    >
      <PerplexitySearch
        defaultOpen={phase === "web"}
        key={phase === "web" ? "web-active" : "web-complete"}
        queries={QUERIES}
        reducedMotion={reducedMotion}
        sequential={phase === "web"}
        sources={SOURCES}
        title="Searching the web"
      />
      {phase === "web" ? null : (
        <PerplexityResearchStep
          defaultOpen={phase === "review"}
          title="Checking the timeline"
        >
          <p>
            Notion announced its Skiff acquisition in February 2024, before
            launching Notion Mail.
          </p>
        </PerplexityResearchStep>
      )}
    </PerplexityResearch>
  );
}

const questionMessage: ChatBlockMessage = {
  id: "question",
  from: "user",
  content: QUESTION,
};
const initialMessages: ChatBlockMessage[] = [
  questionMessage,
  {
    id: "answer",
    from: "assistant",
    search: research("complete"),
    content: answerContent(true),
    text: ANSWER,
  },
];

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function PerplexityPreview() {
  const [messages, setMessages] = useState(initialMessages);
  const [playing, setPlaying] = useState(false);
  const [followMessages, setFollowMessages] = useState(false);
  const runRef = useRef(0);

  useEffect(
    () => () => {
      runRef.current += 1;
    },
    []
  );

  function stop() {
    runRef.current += 1;
    setPlaying(false);
    setFollowMessages(false);
    setMessages(initialMessages);
  }

  async function play() {
    const run = runRef.current + 1;
    runRef.current = run;
    const alive = () => runRef.current === run;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const delay = (ms: number) => wait(reducedMotion ? Math.min(ms, 70) : ms);

    setPlaying(true);
    setFollowMessages(true);
    setMessages([questionMessage]);

    await delay(480);
    if (!alive()) {
      return;
    }
    setMessages([
      questionMessage,
      {
        id: "thinking",
        from: "assistant",
        content: <PerplexityThinking reducedMotion={reducedMotion} />,
      },
    ]);

    await delay(PERPLEXITY_THINKING_MS);
    if (!alive()) {
      return;
    }
    await delay(PERPLEXITY_THINKING_GAP_MS);
    if (!alive()) {
      return;
    }
    const activeResearch = research("web", reducedMotion);
    setMessages([
      questionMessage,
      {
        id: "answer",
        from: "assistant",
        search: activeResearch,
        content: null,
      },
    ]);

    await delay(
      perplexitySearchDuration(QUERIES.length, SOURCES.length, reducedMotion) +
        100
    );
    if (!alive()) {
      return;
    }

    setMessages([
      questionMessage,
      {
        id: "answer",
        from: "assistant",
        search: research("review", reducedMotion),
        content: null,
      },
    ]);

    await delay(620);
    if (!alive()) {
      return;
    }

    setMessages([
      questionMessage,
      {
        id: "answer",
        from: "assistant",
        search: research("complete"),
        content: answerContent(false),
      },
    ]);

    await delay(540);
    if (!alive()) {
      return;
    }
    setMessages([
      questionMessage,
      {
        id: "answer",
        from: "assistant",
        search: research("complete"),
        content: answerContent(true),
        text: ANSWER,
      },
    ]);
    setPlaying(false);
  }

  return (
    <div className="w-full">
      <div className="flex justify-end pb-2">
        <button
          aria-label={playing ? "Stop playback" : "Play conversation"}
          className="flex min-w-28 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-sm text-[#5c5c5c] transition-colors hover:bg-[#f3f3f3] hover:text-[#1a1a1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] dark:text-[#b3b3b3] dark:hover:bg-white/10"
          onClick={() => {
            if (playing) {
              stop();
            } else {
              void play();
            }
          }}
          type="button"
        >
          <HugeiconsIcon icon={playing ? StopIcon : PlayIcon} size={14} />
          {playing ? "Stop" : "Play demo"}
        </button>
      </div>
      <PerplexityChatBlock
        autoScroll={followMessages}
        busy={playing}
        messages={messages}
        onSend={(text) => {
          setFollowMessages(true);
          setMessages((current) => [
            ...current,
            { id: crypto.randomUUID(), from: "user", content: text },
          ]);
        }}
        onStop={stop}
      />
    </div>
  );
}
