"use client";

import {
  Cancel01Icon,
  GlobalIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { useState } from "react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { ChatgptSearch } from "./chatgpt-search";

export interface ChatgptActivitySite {
  domain: string;
  label: string;
}

export interface ChatgptActivitySource {
  id: string;
  publisher: string;
  domain: string;
  title: string;
  snippet: string;
  timeLabel: string;
}

function faviconSrc(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

function SiteFavicon({
  domain,
  className,
}: {
  domain: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-hidden
        className={cn("bg-muted inline-block rounded-full", className)}
      />
    );
  }

  return (
    <img
      alt=""
      className={cn("bg-muted rounded-full", className)}
      height={64}
      onError={() => setFailed(true)}
      src={faviconSrc(domain)}
      width={64}
    />
  );
}

function WebsitePills({ sites }: { sites: ChatgptActivitySite[] }) {
  const visible = sites.slice(0, 3);
  const rest = sites.slice(3);

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((site) => (
        <span
          className="bg-background text-foreground inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[12px] leading-none"
          key={site.domain}
        >
          <SiteFavicon className="size-3.5" domain={site.domain} />
          {site.label}
        </span>
      ))}
      {rest.length > 0 ? (
        <span className="bg-background text-foreground inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[12px] leading-none">
          <span className="flex -space-x-1.5">
            {rest.map((site) => (
              <SiteFavicon
                className="ring-background size-3.5 ring-1"
                domain={site.domain}
                key={site.domain}
              />
            ))}
          </span>
          + {rest.length} more
        </span>
      ) : null}
    </div>
  );
}

export function ChatgptActivity({
  websites,
  seconds,
  sites,
  sources,
  sourceCount,
  className,
}: {
  websites: number;
  seconds: number;
  sites: ChatgptActivitySite[];
  sources: ChatgptActivitySource[];
  sourceCount?: number;
  className?: string;
}) {
  const sourcesLabel = sourceCount ?? sources.length;

  return (
    <Sheet>
      <SheetTrigger
        className={className}
        render={<ChatgptSearch websites={websites} />}
      />
      <SheetContent
        className="w-full gap-0 p-0 sm:max-w-[26rem]"
        showCloseButton={false}
      >
        <SheetHeader className="flex-row items-center justify-between space-y-0 px-5 py-4">
          <SheetTitle className="flex items-baseline gap-1.5 text-[16px] font-semibold">
            Activity
            <span className="text-muted-foreground font-normal">
              · {seconds}s
            </span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Search activity and sources
          </SheetDescription>
          <SheetClose
            render={
              <button
                aria-label="Close"
                className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 items-center justify-center rounded-full transition-colors"
                type="button"
              />
            }
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
          </SheetClose>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          <section className="space-y-4">
            <h3 className="text-foreground text-[15px] font-semibold">
              Thinking
            </h3>
            <div className="relative grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3 gap-y-5">
              <span
                aria-hidden
                className="bg-border absolute top-4 bottom-8 left-[0.4375rem] w-px"
              />
              <HugeiconsIcon
                className="text-muted-foreground relative mt-0.5"
                icon={GlobalIcon}
                size={16}
                strokeWidth={1.75}
              />
              <div className="space-y-2.5">
                <p className="text-foreground text-[14px] leading-5">
                  Searching {websites} websites
                </p>
                <WebsitePills sites={sites} />
              </div>
              <HugeiconsIcon
                className="text-muted-foreground relative mt-0.5"
                icon={Tick02Icon}
                size={16}
                strokeWidth={2}
              />
              <div className="space-y-0.5">
                <p className="text-foreground text-[14px] leading-5">
                  Worked for {seconds}s
                </p>
                <p className="text-muted-foreground text-[13px] leading-5">
                  Done
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8 space-y-4">
            <h3 className="text-foreground text-[15px] font-semibold">
              Sources
              <span className="text-muted-foreground font-normal">
                {" "}
                · {sourcesLabel}
              </span>
            </h3>
            <ul className="space-y-5">
              {sources.map((source) => (
                <li className="flex gap-2.5" key={source.id}>
                  <SiteFavicon
                    className="mt-0.5 size-4 shrink-0"
                    domain={source.domain}
                  />
                  <div className="min-w-0 space-y-1">
                    <p className="text-muted-foreground text-[12px] leading-4">
                      {source.publisher}
                    </p>
                    <p className="text-foreground text-[14px] leading-5 font-semibold">
                      {source.title}
                    </p>
                    <p className="text-muted-foreground text-[13px] leading-5">
                      {source.timeLabel} — {source.snippet}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
