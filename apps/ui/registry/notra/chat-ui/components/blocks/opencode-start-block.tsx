"use client";

import { cn } from "cn";

import { OPENCODE_COLORS } from "../../constants/brainless-opencode";
import type { OpencodeStartBlockProps } from "../../types/chat-block";
import { OpencodeComposer } from "../opencode/opencode-composer";
import { OpencodeLogo } from "../opencode/opencode-logo";

export function OpencodeStartBlock({
  className,
  value,
  defaultValue,
  onChange,
  onKeyDown,
  onSend,
  placeholder = 'Ask anything… "What is the tech stack of this project?"',
  agent = "Build",
  onAgentChange,
  model = "Muse Spark 1.3 Free",
  models,
  onModelChange,
  provider = "OpenCode Zen",
  effort = "xhigh",
  onEffortChange,
  cwd = "~/coding/project:main",
  version,
  tip = (
    <>
      Use{" "}
      <span style={{ color: OPENCODE_COLORS.foreground }}>
        opencode run -f file.ts
      </span>{" "}
      to attach files via CLI
    </>
  ),
}: OpencodeStartBlockProps) {
  return (
    <section
      aria-label="OpenCode start screen"
      className={cn(
        "relative flex h-[38rem] min-h-[30rem] w-full flex-col bg-[var(--opencode-tui-background,#fdfdfd)] font-mono text-[var(--opencode-tui-foreground,#1d1d1d)]",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 pb-12">
        <OpencodeLogo
          className="mx-auto mb-10 h-auto max-w-[65%]"
          scale={1.75}
        />
        <OpencodeComposer
          agent={onAgentChange ? agent : undefined}
          defaultAgent={agent}
          defaultValue={defaultValue}
          defaultEffort={effort}
          defaultModel={model}
          effort={onEffortChange ? effort : undefined}
          model={onModelChange ? model : undefined}
          models={models}
          onAgentChange={onAgentChange}
          onChange={onChange}
          onEffortChange={onEffortChange}
          onKeyDown={onKeyDown}
          onModelChange={onModelChange}
          onSend={onSend}
          placeholder={placeholder}
          provider={provider}
          value={value}
        />
        {tip ? (
          <p
            className="mt-12 text-center text-[11px] leading-relaxed"
            style={{ color: OPENCODE_COLORS.muted }}
          >
            <span
              aria-hidden
              className="mr-2"
              style={{ color: OPENCODE_COLORS.orange }}
            >
              ●
            </span>
            <span className="mr-2" style={{ color: OPENCODE_COLORS.orange }}>
              Tip
            </span>
            {tip}
          </p>
        ) : null}
      </div>
      <div
        className="flex justify-between gap-4 px-4 pb-3 text-[11px]"
        style={{ color: OPENCODE_COLORS.muted }}
      >
        <span className="min-w-0 truncate">{cwd}</span>
        {version ? <span>{version}</span> : null}
      </div>
    </section>
  );
}
