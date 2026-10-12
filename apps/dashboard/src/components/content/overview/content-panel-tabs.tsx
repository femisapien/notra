"use client";

import {
  ArrowShrink01Icon,
  Cancel01Icon,
  FullScreenIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tabs, TabsList, TabsTrigger } from "@notra/ui/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useTranslations } from "use-intl";

import { Button } from "@/components/button";
import { useRightPanel } from "@/components/dashboard/right-panel-context";
import {
  setContentPanelTab,
  useContentPanelTab,
} from "@/lib/content-panel-tab";
import type {
  ContentPanelOverviewProps,
  ContentPanelTab,
} from "@/types/content/overview";

export function ContentPanelTabs() {
  const t = useTranslations("content.overview.tabs");
  const tab = useContentPanelTab();
  return (
    <Tabs
      onValueChange={(value) => setContentPanelTab(value as ContentPanelTab)}
      value={tab}
    >
      <TabsList aria-label={t("label")} className="-ms-3">
        <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
        <TabsTrigger value="agent">{t("agent")}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

/** The overview tab in the same chrome as the agent panel. */
export function ContentPanelOverview({
  onClose,
  children,
}: ContentPanelOverviewProps) {
  const t = useTranslations("content.chatActivity");
  const { expanded, toggleExpanded } = useRightPanel();
  const title = t("defaultTitle");
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="bg-muted flex h-12 shrink-0 items-center justify-between gap-2 rounded-t-[calc(0.75rem-1px)] px-4">
        <ContentPanelTabs />
        <TooltipProvider>
          <div className="-mr-1.5 flex h-full items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-pressed={expanded}
                    className="cursor-pointer"
                    onClick={toggleExpanded}
                    size="icon-sm"
                    variant="ghost"
                  />
                }
              >
                <span className="sr-only">
                  {expanded
                    ? t("exitFullscreenTitle", { title })
                    : t("openFullscreenTitle", { title })}
                </span>
                <HugeiconsIcon
                  className="size-4"
                  icon={expanded ? ArrowShrink01Icon : FullScreenIcon}
                  strokeWidth={1.8}
                />
              </TooltipTrigger>
              <TooltipContent>
                {expanded ? t("exitFullscreen") : t("expandAgent")}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    className="cursor-pointer"
                    onClick={onClose}
                    size="icon-sm"
                    variant="ghost"
                  />
                }
              >
                <span className="sr-only">{t("closeTitle", { title })}</span>
                <HugeiconsIcon
                  className="size-4"
                  icon={Cancel01Icon}
                  strokeWidth={1.8}
                />
              </TooltipTrigger>
              <TooltipContent>{t("closeTitle", { title })}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </header>
      <div className="bg-muted flex min-h-0 flex-1 flex-col overflow-hidden rounded-b-[calc(0.75rem-1px)]">
        <div className="bg-background min-h-0 flex-1 scrollbar-thin overflow-y-auto overscroll-contain rounded-t-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
