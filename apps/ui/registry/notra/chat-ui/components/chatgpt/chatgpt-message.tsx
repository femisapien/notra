import { cn } from "cn";
import type { ReactNode } from "react";

import type { ChatgptMessageRole } from "../../types/chatgpt";

const actionsRevealClassName =
  "opacity-0 transition-opacity duration-150 [@media(hover:hover)]:group-hover/chatgpt-msg:opacity-100 group-focus-within/chatgpt-msg:opacity-100 [@media(hover:none)]:opacity-100";

export function ChatgptMessage({
  from,
  reasoning,
  actions,
  className,
  children,
}: {
  from: ChatgptMessageRole;
  reasoning?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  if (from === "user") {
    return (
      <div className={cn("flex justify-end", className)}>
        <div className="text-foreground max-w-[70%] rounded-[1.5rem] bg-[#e8edf4] px-[18px] py-2.5 text-[15px] leading-6 dark:bg-white/10">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group/chatgpt-msg flex flex-col items-start gap-2",
        className
      )}
    >
      {reasoning}
      <div className="text-foreground max-w-full text-[15px] leading-7">
        {children}
      </div>
      {actions ? (
        <div className={cn("-ms-2", actionsRevealClassName)}>{actions}</div>
      ) : null}
    </div>
  );
}
