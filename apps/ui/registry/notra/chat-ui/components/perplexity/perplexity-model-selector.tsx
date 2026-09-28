"use client";

import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  LockKeyIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PERPLEXITY_MODEL_MENU } from "../../constants/perplexity-models";
import type {
  PerplexityModelBadge,
  PerplexityModelId,
  PerplexityModelMenuItem,
} from "../../types/perplexity";
import { PerplexityModelIcon } from "./perplexity-model-icon";

const MENU_SURFACE =
  "w-80 min-w-80 rounded-[1.15rem] p-1.5 ring-0 shadow-[0_8px_28px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.45)]";

function ModelBadge({ badge }: { badge: PerplexityModelBadge }) {
  if (badge === "max") {
    return (
      <span className="rounded-full bg-[#ececec] px-1.5 py-px text-[9px] leading-none font-medium text-[#6b6b6b] dark:bg-white/10 dark:text-[#b3b3b3]">
        Max
      </span>
    );
  }

  return (
    <span className="rounded-full bg-[#e8f1fb] px-1.5 py-px text-[9px] leading-none font-medium text-[#3d7ab5] dark:bg-[#3d7ab5]/20 dark:text-[#8bb8e0]">
      New
    </span>
  );
}

function ModelRow({ item }: { item: PerplexityModelMenuItem }) {
  return (
    <DropdownMenuItem
      className="h-9 gap-2.5 rounded-[0.7rem] px-2.5 text-xs text-[#8a8a8a] focus:bg-transparent data-disabled:opacity-100 data-highlighted:bg-transparent dark:text-[#a3a3a3] dark:focus:bg-transparent dark:data-highlighted:bg-transparent"
      disabled={item.locked}
    >
      <PerplexityModelIcon provider={item.provider} />
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="truncate">{item.label}</span>
        {item.badge ? <ModelBadge badge={item.badge} /> : null}
      </span>
      {item.locked ? (
        <HugeiconsIcon
          className="shrink-0 text-[#b0b0b0] dark:text-[#7a7a7a]"
          icon={LockKeyIcon}
          size={12}
          strokeWidth={1.75}
        />
      ) : null}
    </DropdownMenuItem>
  );
}

export function PerplexityModelSelector({
  className,
}: {
  model: PerplexityModelId;
  onModelChange?: (model: PerplexityModelId) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu modal={false} onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger
        render={
          <button
            aria-label="Model"
            className={cn(
              "dark:text-foreground flex h-8 shrink-0 items-center gap-1 rounded-full bg-[#f2f2f2] px-2.5 font-sans text-[12px] leading-none text-[#3d3d3d] transition-[background-color,transform] duration-150 outline-none hover:bg-[#ebebeb] focus-visible:ring-2 focus-visible:ring-black/15 active:scale-[0.96] dark:bg-white/10 dark:hover:bg-white/15",
              open && "bg-[#ebebeb] dark:bg-white/15",
              className
            )}
            type="button"
          />
        }
      >
        <span>Model</span>
        <HugeiconsIcon
          className={cn(
            "text-[#8d8d8d] transition-transform duration-150",
            open && "rotate-180"
          )}
          icon={ArrowDown01Icon}
          size={12}
          strokeWidth={2}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={MENU_SURFACE}
        side="top"
        sideOffset={10}
      >
        <DropdownMenuItem className="mb-0.5 h-9 justify-between gap-3 rounded-md border border-[#dce5e3] bg-[#eef2f1] px-3 text-xs font-medium text-[#303636] data-highlighted:bg-[#e4edeb] dark:border-[#262f2f] dark:bg-[#232828] dark:text-[#d6d5d4] dark:data-highlighted:bg-[#2a3333]">
          <span>Access the top AI models</span>
          <HugeiconsIcon
            className="shrink-0 text-[#4e99a3]"
            icon={ArrowRight01Icon}
            size={12}
            strokeWidth={2}
          />
        </DropdownMenuItem>
        {PERPLEXITY_MODEL_MENU.map((item) => (
          <ModelRow item={item} key={item.id} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
