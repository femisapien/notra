import { cn } from "cn";

import type { ChatgptToolCallProps } from "../../types/chatgpt-tool-call";

export function ChatgptToolCall({
  tool,
  input,
  result,
  defaultOpen = false,
  className,
}: ChatgptToolCallProps) {
  return (
    <details
      className={cn(
        "group/tool w-full rounded-xl border border-black/8 bg-[#f7f7f7] text-[13px] dark:border-white/10 dark:bg-white/5",
        className
      )}
      open={defaultOpen}
    >
      <summary className="text-foreground flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-blue-600/35 [&::-webkit-details-marker]:hidden">
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
        <span
          aria-hidden
          className="text-muted-foreground shrink-0 transition-transform group-open/tool:rotate-180"
        >
          ⌄
        </span>
      </summary>
      <div className="text-muted-foreground border-t border-black/8 px-3 py-2.5 font-mono text-xs leading-5 dark:border-white/10">
        {result}
      </div>
    </details>
  );
}
