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
    <div
      className={cn(
        "border-border bg-muted/50 w-full overflow-hidden rounded-xl border text-sm",
        className
      )}
    >
      <Collapsible defaultOpen={defaultOpen}>
        <CollapsibleTrigger
          render={
            <button
              className="text-foreground focus-visible:ring-ring flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left outline-none focus-visible:ring-2 data-[panel-open]:[&_svg]:rotate-180"
              type="button"
            />
          }
        >
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
        <CollapsibleContent>
          <div className="text-muted-foreground border-border border-t px-3 py-2.5 font-mono text-xs leading-5">
            {result}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
