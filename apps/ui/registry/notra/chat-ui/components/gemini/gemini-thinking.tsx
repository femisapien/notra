"use client";

import { cn } from "cn";

import { GeminiSparkle } from "./gemini-sparkle";

export function GeminiThinking({
  label = "Web wird durchsucht",
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
        "dark:text-foreground flex items-center gap-2.5 text-[16px] leading-none text-[#1f1f1f]",
        className
      )}
    >
      <GeminiSparkle animated reducedMotion={reducedMotion} size={20} />
      <span>{label}</span>
    </div>
  );
}
