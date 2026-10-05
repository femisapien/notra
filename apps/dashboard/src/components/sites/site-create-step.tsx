"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";
import type { SiteCreateStepProps } from "@/types/components/sites";

/**
 * One card on the new-site stage. Only the active card is interactive; the
 * others stay visible, dimmed, above and below it. A done card is a way
 * back: clicking it makes it the active one again.
 */
export function SiteCreateStep({
  title,
  description,
  state,
  footer,
  onActivate,
  children,
}: SiteCreateStepProps) {
  const headingId = useId();
  const isActive = state === "active";
  return (
    <section
      aria-current={isActive ? "step" : undefined}
      aria-labelledby={headingId}
      className={cn(
        "border-shell-border bg-shell relative w-full rounded-2xl border shadow-xs transition-[opacity,scale] duration-500 ease-(--ease-emphasized) motion-reduce:transition-none",
        !isActive && "scale-[0.97] opacity-35"
      )}
    >
      <div className="inert:select-none" inert={!isActive}>
        <div
          className={cn(
            "bg-background m-0.5 rounded-[14px] border p-5",
            footer ? "mb-0" : null
          )}
        >
          {/* Wide screens show the title beside the card instead. */}
          <div className="mb-5 space-y-1 @min-[64rem]/main:sr-only">
            <h2
              className="text-base font-semibold tracking-tight"
              id={headingId}
            >
              {title}
            </h2>
            {description ? (
              <p className="text-muted-foreground text-sm text-pretty">
                {description}
              </p>
            ) : null}
          </div>
          {children}
        </div>
        {footer ? (
          <div className="flex items-center justify-end gap-3 px-3 py-2.5">
            {footer}
          </div>
        ) : null}
      </div>
      {state === "done" && onActivate ? (
        // The whole dimmed card leads back to its step.
        <button
          aria-label={title}
          className="focus-visible:ring-ring/50 absolute inset-0 cursor-pointer rounded-2xl outline-none focus-visible:ring-[3px]"
          onClick={onActivate}
          type="button"
        />
      ) : null}
    </section>
  );
}
