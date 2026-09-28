import { cn } from "cn";

import type { ClaudeChatToolCallProps } from "../../types/claude-chat-tool-call";

export function ClaudeChatToolCall({
  tool,
  input,
  result,
  defaultOpen = false,
  className,
}: ClaudeChatToolCallProps) {
  return (
    <details
      className={cn(
        "group/tool w-full rounded-xl border border-[#e8e6e1] bg-white/70 font-sans text-[13px] dark:border-white/10 dark:bg-white/5",
        className
      )}
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-[#5c5a55] outline-none focus-visible:ring-2 focus-visible:ring-[#b87954] dark:text-[#c6c2ba] [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-[#b87954]"
        />
        <span className="shrink-0 font-medium">{tool}</span>
        <code className="min-w-0 flex-1 truncate text-[#8a8680] dark:text-[#a19d95]">
          {input}
        </code>
        <span
          aria-hidden
          className="shrink-0 text-[#8a8680] transition-transform group-open/tool:rotate-180"
        >
          ⌄
        </span>
      </summary>
      <div className="border-t border-[#e8e6e1] px-3 py-2.5 text-[#5c5a55] dark:border-white/10 dark:text-[#c6c2ba]">
        {result}
      </div>
    </details>
  );
}
