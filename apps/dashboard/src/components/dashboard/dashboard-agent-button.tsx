"use client";

import { Robot01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { useTranslations } from "use-intl";

import { useRightPanel } from "@/components/dashboard/right-panel-context";
import {
  setContentPanelTab,
  useContentPanelTab,
} from "@/lib/content-panel-tab";
import { usePathname } from "@/lib/navigation";
import type { RightPanelId } from "@/types/components/right-panel";
import { isContentDetailPathname } from "@/utils/dashboard-paths";

export function DashboardAgentButton() {
  const t = useTranslations("dashboard.agent");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const { active, togglePanel } = useRightPanel();
  const panelId: RightPanelId = isContentDetailPathname(pathname)
    ? "content"
    : "agent";
  const open = active === panelId;
  const contentTab = useContentPanelTab();
  // On a post, the panel also has an overview tab: the agent button always
  // lands on the agent, and only closes the panel when the agent is showing.
  const showingAgent = panelId !== "content" || contentTab === "agent";

  return (
    <Button
      aria-label={open && showingAgent ? t("closeLabel") : t("openLabel")}
      aria-pressed={open && showingAgent}
      className="hover:bg-background size-7 px-0 lg:w-auto lg:px-2.5"
      onClick={() => {
        if (panelId === "content") {
          setContentPanelTab("agent");
          if (open && !showingAgent) {
            return;
          }
        }
        togglePanel(panelId);
      }}
      size="sm"
      title={tCommon("labels.agent")}
      variant={open && showingAgent ? "secondary" : "ghost"}
    >
      <HugeiconsIcon icon={Robot01Icon} strokeWidth={1.8} />
      <span className="hidden lg:inline">{tCommon("labels.agent")}</span>
    </Button>
  );
}
