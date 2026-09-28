"use client";

import { cn } from "cn";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const TRACE_ENTER =
  "animate-in fade-in slide-in-from-top-2 fill-mode-both duration-200 ease-out motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0";

export function ChatgptReasoning({
  seconds,
  complete = false,
  className,
  search,
  children,
}: {
  seconds: number;
  complete?: boolean;
  className?: string;
  search?: ReactNode;
  children?: ReactNode;
}) {
  const label = `Worked for ${seconds}s`;
  const hasPanel = Boolean(children || search);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!complete);
  }, [complete]);

  if (!hasPanel) {
    return (
      <div
        className={cn(
          "text-muted-foreground text-[15px] leading-7 font-medium",
          className
        )}
      >
        {label}
      </div>
    );
  }

  return (
    <Collapsible
      className={cn(
        "text-muted-foreground text-[15px] leading-7 font-medium",
        className
      )}
      onOpenChange={setOpen}
      open={open}
    >
      <CollapsibleTrigger className="focus-visible:ring-ring flex cursor-pointer items-center gap-1 rounded-sm border-0 bg-transparent p-0 text-left font-medium text-inherit outline-none focus-visible:ring-2 data-[panel-open]:[&_svg]:rotate-180">
        <span>{label}</span>
        <svg
          aria-hidden
          className="size-4 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none"
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
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height,opacity] duration-200 ease-out outline-none data-[ending-style]:h-0 data-[ending-style]:opacity-0 data-[starting-style]:h-0 data-[starting-style]:opacity-0 motion-reduce:transition-opacity">
        <div className="mt-2 flex flex-col items-start gap-2.5 font-normal">
          {children ? <div className={TRACE_ENTER}>{children}</div> : null}
          {search ? (
            <div className={cn(TRACE_ENTER, "delay-75 motion-reduce:delay-0")}>
              {search}
            </div>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
