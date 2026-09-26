"use client";

import { Button } from "@notra/ui/components/ui/button";
import {
  ReleaseNote,
  ReleaseNoteAction,
  ReleaseNoteContent,
  ReleaseNoteDescription,
  ReleaseNoteFooter,
  ReleaseNoteHeader,
  ReleaseNoteTitle,
  ReleaseNoteVisual,
} from "@notra/ui/components/ui/release-note";
import { ClaudeAiIcon } from "@notra/ui/components/ui/svgs/claudeAiIcon";
import { Google } from "@notra/ui/components/ui/svgs/google";
import { Openai } from "@notra/ui/components/ui/svgs/openai";
import { Perplexity } from "@notra/ui/components/ui/svgs/perplexity";
import { useState } from "react";

const ENGINES = [
  { name: "ChatGPT", Icon: Openai },
  { name: "Claude", Icon: ClaudeAiIcon },
  { name: "Gemini", Icon: Google },
  { name: "Perplexity", Icon: Perplexity },
] as const;

function GeoLaunchVisual() {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-background ring-foreground/10 w-28 rounded-md p-2 shadow-sm ring-1">
        <p className="text-muted-foreground text-xs font-medium">Prompts</p>
        <p className="mt-1 truncate font-mono text-xs">changelog</p>
        <span className="mt-1.5 inline-flex items-center gap-1 text-xs">
          <span className="bg-info size-1.5 rounded-full" />
          Scanning
        </span>
      </div>
      <svg
        aria-hidden="true"
        className="text-muted-foreground size-5 shrink-0"
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
      <div className="bg-background ring-foreground/10 min-w-0 flex-1 rounded-md p-2 shadow-sm ring-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium">Mentions</p>
          <span className="bg-muted text-foreground rounded-md px-1.5 text-xs font-medium tabular-nums">
            4
          </span>
        </div>
        <ul className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1">
          {ENGINES.map(({ name, Icon }) => (
            <li className="flex min-w-0 items-center gap-1 text-xs" key={name}>
              <Icon aria-hidden="true" className="size-3 shrink-0" />
              <span className="truncate">{name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function GeoLaunchReleaseDemo() {
  const [open, setOpen] = useState(true);

  return (
    <ReleaseNote onOpenChange={setOpen} open={open}>
      <Button disabled={open} onClick={() => setOpen(true)} variant="outline">
        Show release note
      </Button>
      <ReleaseNoteContent>
        <ReleaseNoteVisual>
          <GeoLaunchVisual />
        </ReleaseNoteVisual>
        <ReleaseNoteHeader>
          <ReleaseNoteTitle>GEO is live</ReleaseNoteTitle>
          <ReleaseNoteDescription>
            Each prompt gets its own scan, with mentions across the engines you
            follow.
          </ReleaseNoteDescription>
        </ReleaseNoteHeader>
        <ReleaseNoteFooter>
          <ReleaseNoteAction>OK</ReleaseNoteAction>
        </ReleaseNoteFooter>
      </ReleaseNoteContent>
    </ReleaseNote>
  );
}
