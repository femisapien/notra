"use client";

import { cn } from "cn";

import type { OpencodeChatBlockProps } from "../../types/chat-block";
import { OpencodeComposer } from "../opencode/opencode-composer";
import { OpencodeSidebar } from "../opencode/opencode-sidebar";

export function OpencodeBlock({
  children,
  className,
  value,
  defaultValue,
  onChange,
  onKeyDown,
  onSend,
  placeholder,
  agent,
  onAgentChange,
  model,
  models,
  onModelChange,
  provider,
  effort,
  onEffortChange,
  context,
  cwd,
  sidebar,
  footer,
}: OpencodeChatBlockProps) {
  return (
    <section
      aria-label="OpenCode conversation"
      className={cn(
        "grid min-h-[34rem] w-full bg-[var(--opencode-tui-background,#fdfdfd)] font-mono text-[var(--opencode-tui-foreground,#1d1d1d)]",
        sidebar && "md:grid-cols-[minmax(0,1fr)_15rem]",
        className
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-col p-4 sm:p-6">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
          {children}
        </div>
        <OpencodeComposer
          agent={agent}
          className="pt-4"
          context={context}
          models={models}
          value={value}
          defaultValue={defaultValue}
          effort={effort}
          model={model}
          onAgentChange={onAgentChange}
          onChange={onChange}
          onEffortChange={onEffortChange}
          onKeyDown={onKeyDown}
          onModelChange={onModelChange}
          onSend={onSend}
          placeholder={placeholder}
          provider={provider}
        />
        {footer ??
          (cwd ? (
            <div className="mt-2 text-[11px] text-[var(--opencode-tui-muted,#929292)]">
              {cwd}
            </div>
          ) : null)}
      </div>
      {sidebar ? (
        <OpencodeSidebar
          {...sidebar}
          className={cn("hidden md:flex", sidebar?.className)}
          cwd={sidebar?.cwd ?? cwd}
        />
      ) : null}
    </section>
  );
}
