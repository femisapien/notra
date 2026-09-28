"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import {
  ArrowReloadHorizontalIcon,
  Copy01Icon,
  Download01Icon,
  MoreHorizontalIcon,
  Share03Icon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import type { ReactNode } from "react";
import { useState } from "react";

import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { PerplexitySearchSource } from "../../types/perplexity";
import { PerplexitySourcesSheet } from "./perplexity-sources-sheet";

function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipTrigger
        render={
          <button
            aria-label={label}
            className="dark:hover:text-foreground flex size-8 cursor-pointer items-center justify-center rounded-full text-[#8d8d8d] transition-[color,background-color,transform] duration-150 outline-none hover:bg-[#f3f3f3] hover:text-[#1a1a1a] focus-visible:ring-2 focus-visible:ring-black/15 active:scale-[0.96] dark:text-[#a3a3a3] dark:hover:bg-white/10 dark:focus-visible:ring-white/20 [&_svg]:size-4"
            onClick={onClick}
            type="button"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {label}
      </TooltipContent>
    </TooltipPrimitive.Root>
  );
}

export function PerplexityActions({
  text,
  sources,
  className,
}: {
  text: string;
  sources?: readonly PerplexitySearchSource[];
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <TooltipProvider delay={200}>
      <div className={cn("flex w-full items-center", className)}>
        <div className="flex items-center gap-1">
          <ActionButton label="Share">
            <HugeiconsIcon icon={Share03Icon} strokeWidth={1.75} />
          </ActionButton>
          <ActionButton label="Download">
            <HugeiconsIcon icon={Download01Icon} strokeWidth={1.75} />
          </ActionButton>
          <ActionButton
            label={copied ? "Copied" : "Copy"}
            onClick={() => {
              void navigator.clipboard
                .writeText(text)
                .then(() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                })
                .catch(() => undefined);
            }}
          >
            <HugeiconsIcon
              icon={copied ? Tick01Icon : Copy01Icon}
              strokeWidth={1.75}
            />
          </ActionButton>
          <ActionButton label="Rewrite">
            <HugeiconsIcon
              icon={ArrowReloadHorizontalIcon}
              strokeWidth={1.75}
            />
          </ActionButton>
        </div>

        {sources && sources.length > 0 ? (
          <PerplexitySourcesSheet sources={sources} />
        ) : null}

        <div className="ms-auto flex items-center gap-1">
          <ActionButton label="Good response">
            <HugeiconsIcon icon={ThumbsUpIcon} strokeWidth={1.75} />
          </ActionButton>
          <ActionButton label="Bad response">
            <HugeiconsIcon icon={ThumbsDownIcon} strokeWidth={1.75} />
          </ActionButton>
          <ActionButton label="More">
            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={1.75} />
          </ActionButton>
        </div>
      </div>
    </TooltipProvider>
  );
}
