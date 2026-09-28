import { cn } from "cn";
import type { ReactNode } from "react";

export type PerplexityMessageRole = "user" | "assistant";

export function PerplexityMessage({
  from,
  search,
  actions,
  className,
  children,
}: {
  from: PerplexityMessageRole;
  search?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  if (from === "user") {
    return (
      <div className={cn("flex justify-end", className)}>
        <div className="dark:text-foreground max-w-[min(36rem,82%)] rounded-[1.35rem] bg-[#f3f3f3] px-[18px] py-2.5 font-sans text-[15px] leading-6 text-[#1a1a1a] dark:bg-white/10">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full flex-col items-start gap-2", className)}>
      {search}
      {children ? (
        <div className="dark:text-foreground w-full max-w-[42rem] font-[Georgia,serif] text-[17.5px] leading-[1.75] text-[#1a1a1a]">
          {children}
        </div>
      ) : null}
      {actions ? (
        <div className="-ms-1.5 w-full max-w-[42rem]">{actions}</div>
      ) : null}
    </div>
  );
}
