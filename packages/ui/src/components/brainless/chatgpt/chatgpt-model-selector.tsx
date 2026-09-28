"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { cn } from "@notra/ui/lib/utils";
import {
  CHATGPT_EFFORTS,
  CHATGPT_MODELS,
} from "../../../constants/chatgpt-models";
import {
  getChatgptEffort,
  getChatgptModel,
} from "../../../lib/chatgpt-model";
import type { ChatgptEffortId, ChatgptModelId } from "../../../types/chatgpt";

const MENU_SURFACE =
  "w-72 rounded-2xl p-1.5 ring-0 shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.08)] dark:ring-0 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.4)]";

const SECTION_LABEL =
  "px-2.5 pb-1 pt-2 text-[11px] font-medium text-muted-foreground";

const MODEL_OPTION =
  "h-8 cursor-pointer rounded-lg py-0 pr-7 pl-2.5 text-[13px] focus:bg-[#f2f2f2] data-highlighted:bg-[#f2f2f2] dark:focus:bg-[#2b2b2b] dark:data-highlighted:bg-[#2b2b2b]";

export function ChatgptModelSelector({
  model,
  effort,
  onModelChange,
  onEffortChange,
  className,
}: {
  model: ChatgptModelId;
  effort: ChatgptEffortId;
  onModelChange?: (model: ChatgptModelId) => void;
  onEffortChange?: (effort: ChatgptEffortId) => void;
  className?: string;
}) {
  const selectedModel = getChatgptModel(model);
  const selectedEffort = getChatgptEffort(effort);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        closeDelay={200}
        delay={75}
        openOnHover
        render={
          <button
            aria-label={`Model ${selectedModel.label}, effort ${selectedEffort.label}`}
            className={cn(
              "group/chatgpt-model flex h-8 shrink-0 items-center gap-1 rounded-full bg-transparent px-2.5 text-[13px] leading-none text-foreground outline-none transition-colors duration-fast hover:bg-[#f2f2f2] data-popup-open:bg-[#f2f2f2] dark:hover:bg-[#2b2b2b] dark:data-popup-open:bg-[#2b2b2b] focus-visible:ring-2 focus-visible:ring-blue-600/35",
              className
            )}
            type="button"
          />
        }
      >
        <span>{selectedEffort.label}</span>
        <HugeiconsIcon
          className="text-muted-foreground transition-transform duration-fast group-data-popup-open/chatgpt-model:rotate-180"
          icon={ArrowDown01Icon}
          size={12}
          strokeWidth={2}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={MENU_SURFACE}
        side="top"
        sideOffset={8}
      >
        <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="min-w-0 pr-1">
            <p aria-hidden className={SECTION_LABEL}>Model</p>
            <DropdownMenuRadioGroup
              aria-label="Model"
              onValueChange={(value) => {
                const next = CHATGPT_MODELS.find((item) => item.id === value);
                if (next) {
                  onModelChange?.(next.id);
                }
              }}
              value={model}
            >
              {CHATGPT_MODELS.map((item) => (
                <DropdownMenuRadioItem
                  className={MODEL_OPTION}
                  key={item.id}
                  value={item.id}
                >
                  {item.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </div>
          <div className="min-w-0 border-l border-black/8 pl-1 dark:border-white/10">
            <p aria-hidden className={SECTION_LABEL}>Effort</p>
            <DropdownMenuRadioGroup
              aria-label="Effort"
              onValueChange={(value) => {
                const next = CHATGPT_EFFORTS.find((item) => item.id === value);
                if (next) {
                  onEffortChange?.(next.id);
                }
              }}
              value={effort}
            >
              {CHATGPT_EFFORTS.map((item) => (
                <DropdownMenuRadioItem
                  className={MODEL_OPTION}
                  key={item.id}
                  value={item.id}
                >
                  {item.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
