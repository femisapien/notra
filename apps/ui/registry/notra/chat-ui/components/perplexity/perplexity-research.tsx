"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import type {
  PerplexityResearchProps,
  PerplexityResearchStepProps,
} from "../../types/perplexity";
import { Perplexity } from "../ui/svgs/perplexity";

const PANEL_CLASS =
  "grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out data-closed:grid-rows-[0fr] data-open:grid-rows-[1fr] data-[ending-style]:grid-rows-[0fr] data-[ending-style]:opacity-0 data-[starting-style]:grid-rows-[0fr] data-[starting-style]:opacity-0 motion-reduce:transition-none";

export function PerplexityResearch({
  status = "researched",
  duration,
  defaultOpen = false,
  className,
  children,
}: PerplexityResearchProps) {
  return (
    <Collapsible
      className={cn("w-full max-w-[42rem] font-sans", className)}
      defaultOpen={defaultOpen}
    >
      <CollapsibleTrigger className="group/research flex w-full items-center gap-2.5 rounded-md py-0.5 text-left text-[14px] leading-5 text-[#5c5c5c] outline-none hover:text-[#1a1a1a] focus-visible:ring-2 focus-visible:ring-black/15 dark:text-[#b3b3b3] dark:hover:text-white">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#e8e8e8] text-[#777] dark:border-white/10 dark:text-[#a3a3a3]">
          <Perplexity
            aria-hidden
            className="size-[19px]"
            color="currentColor"
          />
        </span>
        <span aria-live="polite" className="min-w-0 flex-1 truncate">
          {status === "researching" ? "Researching" : "Researched"}
          {duration ? (
            <span className="ms-1 text-[#8d8d8d]"> {duration}</span>
          ) : null}
        </span>
        <HugeiconsIcon
          className="shrink-0 text-[#8d8d8d] transition-transform duration-200 group-data-panel-open/research:rotate-180 motion-reduce:transition-none"
          icon={ArrowDown01Icon}
          size={14}
          strokeWidth={2}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className={PANEL_CLASS} keepMounted>
        <div className="min-h-0 overflow-hidden ps-[15px]">
          <div className="relative flex flex-col gap-3 py-3 ps-6">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 start-0 w-px bg-gradient-to-b from-[#e8e8e8] via-[#e8e8e8] to-transparent dark:from-white/10 dark:via-white/10"
            />
            {children}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PerplexityResearchStep({
  title,
  defaultOpen = false,
  className,
  children,
}: PerplexityResearchStepProps) {
  return (
    <Collapsible className={cn("w-full", className)} defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="group/step flex w-full items-center gap-2 rounded-md py-0.5 text-left text-[14px] leading-5 text-[#5c5c5c] outline-none hover:text-[#1a1a1a] focus-visible:ring-2 focus-visible:ring-black/15 dark:text-[#b3b3b3] dark:hover:text-white">
        <span className="flex size-4 shrink-0 items-center justify-center">
          <span className="size-2 rounded-full border border-current" />
        </span>
        <span className="min-w-0 flex-1 truncate">{title}</span>
        <HugeiconsIcon
          className="shrink-0 text-[#8d8d8d] transition-transform duration-200 group-data-panel-open/step:rotate-180 motion-reduce:transition-none"
          icon={ArrowDown01Icon}
          size={14}
          strokeWidth={2}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className={PANEL_CLASS} keepMounted>
        <div className="min-h-0 overflow-hidden ps-6 pt-2 text-[13.5px] leading-5 text-[#6b6b6b] dark:text-[#a8a8a8]">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
