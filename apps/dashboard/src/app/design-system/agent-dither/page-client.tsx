"use client";

import { ArrowUp02Icon, AtIcon, StopIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ChatStatus, UIMessage } from "ai";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Composer } from "@/components/composer/composer-shell";
import { ContentChatActivityPanel } from "@/components/content/content-chat-activity-panel";
import { RightPanelProvider } from "@/components/dashboard/right-panel-context";
import {
  DASHBOARD_AGENT_CHAT_PLACEHOLDER,
  DASHBOARD_AGENT_TITLE,
} from "@/constants/dashboard-agent";
import { RIGHT_PANEL_FRAME_CLASSNAME } from "@/constants/right-panel";

const NOOP = () => undefined;
const FIRST_MESSAGE = "Draft a short launch note for GEO tracking.";
const EMPTY_DELAY_MS = 3500;
const TYPE_INTERVAL_MS = 28;
const SEND_PAUSE_MS = 450;
const WORKING_HOLD_MS = 4000;

const FIRST_USER_MESSAGE: UIMessage = {
  id: "user-1",
  role: "user",
  parts: [{ type: "text", text: FIRST_MESSAGE }],
};

type PreviewPhase = "empty" | "typing" | "working";

function MockComposer({ draft, working }: { draft: string; working: boolean }) {
  const showStop = working;
  const value = working ? "" : draft;
  const placeholder = working
    ? "Queue a message..."
    : DASHBOARD_AGENT_CHAT_PLACEHOLDER;

  return (
    <div className="shrink-0 p-2 pt-1">
      <Composer.Frame>
        <div className="flex min-w-0 items-end gap-1 p-1.5">
          <Composer.ToolbarButton
            aria-label="Add tools or context"
            className="size-7 justify-center px-0"
            type="button"
          >
            <HugeiconsIcon className="size-4" icon={AtIcon} />
          </Composer.ToolbarButton>
          <p
            className={
              value
                ? "text-foreground min-h-7 flex-1 px-1 py-1 text-sm leading-5"
                : "text-muted-foreground min-h-7 flex-1 px-1 py-1 text-sm leading-5"
            }
          >
            {value || placeholder}
          </p>
          <Composer.Send
            disabled={!showStop && value.trim().length === 0}
            label={showStop ? "Stop generating" : "Send message"}
            onClick={NOOP}
            tooltip={showStop ? "Stop generating" : "Send message"}
          >
            <HugeiconsIcon
              className="size-4"
              icon={showStop ? StopIcon : ArrowUp02Icon}
              strokeWidth={2}
            />
          </Composer.Send>
        </div>
      </Composer.Frame>
    </div>
  );
}

export default function AgentDitherPreviewPage() {
  const { setTheme } = useTheme();
  const [phase, setPhase] = useState<PreviewPhase>("empty");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  useEffect(() => {
    if (phase !== "empty") {
      return;
    }

    const startTyping = window.setTimeout(() => {
      setPhase("typing");
    }, EMPTY_DELAY_MS);

    return () => window.clearTimeout(startTyping);
  }, [phase]);

  useEffect(() => {
    if (phase !== "working") {
      return;
    }

    const reset = window.setTimeout(() => {
      setDraft("");
      setPhase("empty");
    }, WORKING_HOLD_MS);

    return () => window.clearTimeout(reset);
  }, [phase]);

  useEffect(() => {
    if (phase !== "typing") {
      return;
    }

    let count = 0;
    let sendTimeout = 0;
    const interval = window.setInterval(() => {
      count += 1;
      setDraft(FIRST_MESSAGE.slice(0, count));
      if (count < FIRST_MESSAGE.length) {
        return;
      }
      window.clearInterval(interval);
      sendTimeout = window.setTimeout(() => {
        setPhase("working");
        setDraft("");
      }, SEND_PAUSE_MS);
    }, TYPE_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(sendTimeout);
    };
  }, [phase]);

  const messages = phase === "working" ? [FIRST_USER_MESSAGE] : [];
  const status: ChatStatus = phase === "working" ? "streaming" : "ready";

  return (
    <RightPanelProvider>
      <main className="bg-muted flex h-svh items-center justify-center p-6">
        <div
          className={`${RIGHT_PANEL_FRAME_CLASSNAME} my-0 mr-0 h-[42rem] w-96`}
        >
          <ContentChatActivityPanel
            activeChatId="mock-chat"
            isHistoryLoading={false}
            messages={messages}
            onClose={NOOP}
            onNewChat={NOOP}
            onSelectChat={NOOP}
            sessions={[]}
            showHistory={false}
            status={status}
            title={DASHBOARD_AGENT_TITLE}
          >
            <MockComposer draft={draft} working={phase === "working"} />
          </ContentChatActivityPanel>
        </div>
      </main>
    </RightPanelProvider>
  );
}
