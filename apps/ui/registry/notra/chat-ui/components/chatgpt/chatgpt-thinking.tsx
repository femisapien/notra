"use client";

import { cn } from "cn";

import { Shimmer } from "../ai-elements/shimmer";

export function ChatgptThinking({
  className,
  reducedMotion = false,
}: {
  className?: string;
  reducedMotion?: boolean;
}) {
  return (
    <div
      className={cn(
        "animate-in fade-in text-muted-foreground text-[15px] leading-7 duration-200 ease-out motion-reduce:animate-none",
        className
      )}
    >
      {reducedMotion ? (
        "Thinking"
      ) : (
        <Shimmer className="font-medium">Thinking</Shimmer>
      )}
    </div>
  );
}
