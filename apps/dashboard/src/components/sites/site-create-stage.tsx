"use client";

import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { SiteCreateStageProps } from "@/types/components/sites";

/**
 * A fixed-height window onto the step cards, like Cloudflare's "Create an
 * app": nothing scrolls, the column of cards glides so the active one sits in
 * the middle, and the neighbours fade out at the edges. What sits beside the
 * active card (its title on the left, the step list on the right) travels
 * with it, level with its top edge.
 */
export function SiteCreateStage({
  activeIndex,
  left,
  right,
  children,
}: SiteCreateStageProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    offset: number;
    top: number;
  } | null>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const column = columnRef.current;
    if (!(track && column)) {
      return;
    }
    const measure = () => {
      const card = column.children[activeIndex] as HTMLElement | undefined;
      if (!card) {
        return;
      }
      // Centre the card. The first one has nothing above it to show, so it sits
      // at the top, as does a card taller than the stage.
      const tall = card.offsetHeight > track.clientHeight - 48;
      let offset =
        track.clientHeight / 2 - (card.offsetTop + card.offsetHeight / 2);
      if (activeIndex === 0) {
        offset = 8;
      } else if (tall) {
        offset = 24 - card.offsetTop;
      }
      setPosition({ offset, top: offset + card.offsetTop });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    for (const card of column.children) {
      observer.observe(card);
    }
    return () => observer.disconnect();
  }, [activeIndex]);

  const glide =
    "transition-[translate] duration-700 ease-(--ease-emphasized) motion-reduce:transition-none";
  // No glide on the first measurement, only between steps.
  const unplaced = position === null && "invisible duration-0";

  return (
    <div
      className="relative flex min-h-0 flex-1 justify-center gap-10"
      style={
        {
          "--stage-offset": `${position?.offset ?? 0}px`,
          "--stage-top": `${position?.top ?? 0}px`,
        } as CSSProperties
      }
    >
      <div className="relative hidden w-56 shrink-0 @min-[64rem]/main:block">
        <div
          className={cn(
            "absolute inset-x-0 top-0 translate-y-(--stage-top)",
            glide,
            unplaced
          )}
        >
          {left}
        </div>
      </div>
      <div
        className="relative max-w-xl min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_4%,black_90%,transparent)]"
        ref={trackRef}
      >
        <div
          className={cn(
            "absolute inset-x-0 top-0 flex translate-y-(--stage-offset) flex-col gap-10 px-1",
            glide,
            unplaced
          )}
          ref={columnRef}
        >
          {children}
        </div>
      </div>
      <div className="relative hidden w-56 shrink-0 @min-[64rem]/main:block">
        <div
          className={cn(
            "absolute inset-x-0 top-0 translate-y-(--stage-top)",
            glide,
            unplaced
          )}
        >
          {right}
        </div>
      </div>
    </div>
  );
}
