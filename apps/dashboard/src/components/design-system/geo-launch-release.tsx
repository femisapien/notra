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
    <div className="flex w-full max-w-lg items-stretch gap-3">
      <div className="border-border bg-background flex w-40 flex-col rounded-xl border p-3">
        <p className="text-muted-foreground text-xs">Prompt</p>
        <p className="mt-2 text-sm">best changelog tool</p>
        <p className="text-muted-foreground mt-auto flex items-center gap-1.5 pt-4 text-xs">
          <span className="bg-info size-1.5 rounded-full" />
          Scanning
        </p>
      </div>
      <div
        className="text-muted-foreground flex items-center"
        aria-hidden="true"
      >
        <svg className="size-4" fill="none" viewBox="0 0 16 16">
          <path
            d="M3 8h10M9 4l4 4-4 4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <div className="border-border bg-background min-w-0 flex-1 rounded-xl border p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs">Mentions</p>
          <p className="text-muted-foreground text-xs tabular-nums">4</p>
        </div>
        <ul className="mt-2 space-y-1.5">
          {ENGINES.map(({ name, Icon }) => (
            <li className="flex items-center gap-2 text-sm" key={name}>
              <Icon aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="truncate">{name}</span>
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
    <div className="bg-muted w-64 rounded-xl p-3">
      <p className="text-muted-foreground mb-3 px-0.5 text-xs">{label}</p>
      {children}
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
