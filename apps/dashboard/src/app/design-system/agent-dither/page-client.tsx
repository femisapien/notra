"use client";

import { AtIcon, StopIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { UIMessage } from "ai";
import { useTheme } from "next-themes";
import { useEffect } from "react";

import { Composer } from "@/components/composer/composer-shell";
import { ContentChatActivityPanel } from "@/components/content/content-chat-activity-panel";
import { RightPanelProvider } from "@/components/dashboard/right-panel-context";
import { DASHBOARD_AGENT_TITLE } from "@/constants/dashboard-agent";
import { RIGHT_PANEL_FRAME_CLASSNAME } from "@/constants/right-panel";

const NOOP = () => undefined;

const MOCK_MESSAGES: UIMessage[] = [
  {
    id: "user-1",
    role: "user",
    parts: [
      {
        type: "text",
        text: "Draft a short launch note for GEO tracking.",
      },
    ],
  },
  {
    id: "assistant-1",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "I'll keep it under 120 words and lead with weekly mention tracking.",
      },
    ],
  },
  {
    id: "user-2",
    role: "user",
    parts: [
      {
        type: "text",
        text: "Mention that it works across ChatGPT, Perplexity, and Gemini.",
      },
    ],
  },
];

function MockWorkingComposer() {
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
          <p className="text-muted-foreground min-h-7 flex-1 px-1 py-1 text-sm leading-5">
            Queue a message...
          </p>
          <Composer.Send
            label="Stop generating"
            onClick={NOOP}
            tooltip="Stop generating"
          >
            <HugeiconsIcon className="size-4" icon={StopIcon} strokeWidth={2} />
          </Composer.Send>
        </div>
      </Composer.Frame>
    </div>
  );
}

export default function AgentDitherPreviewPage() {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  return (
    <RightPanelProvider>
      <main className="bg-muted flex h-svh items-center justify-center p-6">
        <div
          className={`${RIGHT_PANEL_FRAME_CLASSNAME} my-0 mr-0 h-[42rem] w-96`}
        >
          <ContentChatActivityPanel
            activeChatId="mock-chat"
            isHistoryLoading={false}
            messages={MOCK_MESSAGES}
            onClose={NOOP}
            onNewChat={NOOP}
            onSelectChat={NOOP}
            sessions={[]}
            showHistory={false}
            status="streaming"
            title={DASHBOARD_AGENT_TITLE}
          >
            <MockWorkingComposer />
          </ContentChatActivityPanel>
        </div>
      </main>
    </RightPanelProvider>
  );
}
