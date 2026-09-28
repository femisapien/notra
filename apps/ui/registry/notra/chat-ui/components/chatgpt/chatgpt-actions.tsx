"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import {
  ArrowReloadHorizontalIcon,
  Copy01Icon,
  MoreHorizontalIcon,
  Share01Icon,
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

function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipTrigger
        render={
          <button
            aria-label={label}
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 items-center justify-center rounded-lg transition-colors [&_svg]:size-4"
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

export function ChatgptActions({
  text,
  onShare,
  onRedo,
  onMore,
  className,
}: {
  text: string;
  onShare?: () => void;
  onRedo?: () => void;
  onMore?: () => void;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <TooltipProvider delay={200}>
      <div
        className={cn(
          "text-muted-foreground flex items-center gap-0.5",
          className
        )}
      >
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
        {onShare ? (
          <ActionButton label="Share" onClick={onShare}>
            <HugeiconsIcon icon={Share01Icon} strokeWidth={1.75} />
          </ActionButton>
        ) : null}
        {onRedo ? (
          <ActionButton label="Redo" onClick={onRedo}>
            <HugeiconsIcon
              icon={ArrowReloadHorizontalIcon}
              strokeWidth={1.75}
            />
          </ActionButton>
        ) : null}
        {onMore ? (
          <ActionButton label="More" onClick={onMore}>
            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={1.75} />
          </ActionButton>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
