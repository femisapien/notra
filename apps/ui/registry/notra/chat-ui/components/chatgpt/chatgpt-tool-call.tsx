"use client";

import { cn } from "cn";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import type { ChatgptToolCallProps } from "../../types/chatgpt-tool-call";

export function ChatgptToolCall({
  tool,
  input,
  result,
  defaultOpen = false,
  className,
}: ChatgptToolCallProps) {
  return (
    <Collapsible
      className={cn(
        "w-full rounded-xl border border-black/8 bg-[#f7f7f7] text-[13px] dark:border-white/10 dark:bg-white/5",
        className
      )}
      defaultOpen={defaultOpen}
    >
      <CollapsibleTrigger className="text-foreground flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-600/35 data-[panel-open]:[&_svg]:rotate-180">
        <span
          aria-hidden
          className="flex size-5 shrink-0 items-center justify-center rounded-md bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
        >
          ↗
        </span>
        <span className="shrink-0 font-medium">{tool}</span>
        <code className="text-muted-foreground min-w-0 flex-1 truncate">
          {input}
        </code>
        <svg
          aria-hidden
          className="text-muted-foreground size-4 shrink-0 transition-transform"
          fill="none"
          viewBox="0 0 16 16"
        >
          <path
            d="M4 6.25 8 10.25 12 6.25"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </CollapsibleTrigger>
      <CollapsibleContent className="text-muted-foreground border-t border-black/8 px-3 py-2.5 font-mono text-xs leading-5 dark:border-white/10">
        {result}
      </CollapsibleContent>
    </Collapsible>
  );
}
