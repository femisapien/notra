"use client";

import { cn } from "cn";

import { Shimmer } from "../ai-elements/shimmer";

export function PerplexityThinking({
  label = "Thinking...",
  reducedMotion = false,
  className,
}: {
  label?: string;
  reducedMotion?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "animate-in fade-in font-sans text-[14px] leading-5 text-[#5c5c5c] duration-200 ease-out motion-reduce:animate-none dark:text-[#b3b3b3]",
        className
      )}
    >
      {reducedMotion ? (
        label
      ) : (
        <Shimmer className="font-medium">{label}</Shimmer>
      )}
    </div>
  );
}
