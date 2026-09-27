"use client";

import {
  ReleaseNote,
  ReleaseNoteAction,
  ReleaseNoteContent,
  ReleaseNoteDescription,
  ReleaseNoteFooter,
  ReleaseNoteHeader,
  ReleaseNoteStack,
  ReleaseNoteTitle,
  ReleaseNoteVisual,
  type ReleaseNoteItem,
} from "@notra/ui/components/ui/release-note";
import { ClaudeAiIcon } from "@notra/ui/components/ui/svgs/claudeAiIcon";
import { Google } from "@notra/ui/components/ui/svgs/google";
import { Openai } from "@notra/ui/components/ui/svgs/openai";
import { Perplexity } from "@notra/ui/components/ui/svgs/perplexity";
import { useState, type ReactNode } from "react";

const GEO_NOTE: ReleaseNoteItem = {
  id: "geo",
  title: "GEO is live",
  detail: "Scans and mentions for every prompt.",
};

const STACKED_NOTES: readonly ReleaseNoteItem[] = [
  GEO_NOTE,
  {
    id: "personas",
    title: "Personas",
    detail: "See how each buyer shows up in answers.",
  },
];

const ENGINES = [
  { name: "ChatGPT", Icon: Openai },
  { name: "Claude", Icon: ClaudeAiIcon },
  { name: "Gemini", Icon: Google },
  { name: "Perplexity", Icon: Perplexity },
] as const;

function GeoLaunchVisual() {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-background ring-foreground/10 w-44 rounded-lg p-3 shadow-sm ring-1">
        <p className="text-muted-foreground text-xs font-medium">Prompts</p>
        <p className="mt-2 font-mono text-xs">best changelog tool</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs">
          <span className="bg-info size-1.5 rounded-full" />
          Scanning
        </span>
      </div>
      <svg
        aria-hidden="true"
        className="text-muted-foreground size-8 shrink-0"
        fill="none"
        viewBox="0 0 32 16"
      >
        <path
          d="M1 8h26M21 2l6 6-6 6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
      <div className="bg-background ring-foreground/10 w-52 rounded-lg p-3 shadow-sm ring-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium">Mentions</p>
          <span className="bg-muted text-foreground rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums">
            4
          </span>
        </div>
        <ul className="mt-2 space-y-1.5">
          {ENGINES.map(({ name, Icon }) => (
            <li className="flex items-center gap-2 text-xs" key={name}>
              <Icon aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{name}</span>
              <span className="text-muted-foreground">Cited</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SidebarSpot({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="bg-sidebar ring-sidebar-border w-64 rounded-xl p-3 ring-1">
      <p className="text-muted-foreground px-1 pb-2 text-xs">{label}</p>
      {children}
      <p className="text-muted-foreground mt-3 border-t px-1 pt-3 text-xs">
        Workspace
      </p>
    </div>
  );
}

export function GeoLaunchReleaseDemo() {
  const [openId, setOpenId] = useState<string | null>(null);
  const openNote =
    STACKED_NOTES.find((note) => note.id === openId) ??
    (openId === GEO_NOTE.id ? GEO_NOTE : null);

  return (
    <>
      <div className="flex flex-wrap items-start gap-8">
        <SidebarSpot label="One note">
          <ReleaseNoteStack items={[GEO_NOTE]} onSelect={setOpenId} />
        </SidebarSpot>
        <SidebarSpot label="A few notes">
          <ReleaseNoteStack items={STACKED_NOTES} onSelect={setOpenId} />
        </SidebarSpot>
      </div>
      <ReleaseNote
        onOpenChange={(open) => {
          if (!open) {
            setOpenId(null);
          }
        }}
        open={openNote !== null}
      >
        <ReleaseNoteContent>
          {openNote?.id === "geo" ? (
            <ReleaseNoteVisual>
              <GeoLaunchVisual />
            </ReleaseNoteVisual>
          ) : null}
          <ReleaseNoteHeader>
            <ReleaseNoteTitle>{openNote?.title}</ReleaseNoteTitle>
            <ReleaseNoteDescription>
              {openNote?.id === "geo"
                ? "Each tracked prompt gets its own scan, separate from your changelog, with mentions across the engines you follow."
                : openNote?.detail}
            </ReleaseNoteDescription>
          </ReleaseNoteHeader>
          <ReleaseNoteFooter>
            <ReleaseNoteAction>OK</ReleaseNoteAction>
          </ReleaseNoteFooter>
        </ReleaseNoteContent>
      </ReleaseNote>
    </>
  );
}
