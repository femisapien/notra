"use client";

import { useSyncExternalStore } from "react";

import type { ContentPanelTab } from "@/types/content/overview";

// The header's agent button, the floating composer and the toolbar's details
// button all live outside the panel, so the active tab is a tiny global store.
let activeTab: ContentPanelTab = "overview";
const listeners = new Set<() => void>();

export function setContentPanelTab(tab: ContentPanelTab) {
  if (tab === activeTab) {
    return;
  }
  activeTab = tab;
  for (const listener of listeners) {
    listener();
  }
}

function getContentPanelTab(): ContentPanelTab {
  return activeTab;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useContentPanelTab(): ContentPanelTab {
  return useSyncExternalStore(subscribe, getContentPanelTab, () => "overview");
}
