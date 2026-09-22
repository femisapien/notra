import { LockKeyIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";

import type { SharedContentViewModel } from "@/types/content-share";

export function SharedContentView({
  content,
}: {
  content: SharedContentViewModel;
}) {
  return (
    <div className="bg-background min-h-dvh">
      <header className="border-border/60 bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <p className="text-sm font-semibold tracking-tight">Notra</p>
          <p className="text-muted-foreground text-xs">Shared content</p>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-pretty">
            {content.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            Anyone with this link can view this content.
          </p>
        </div>
        <SharedContentBody content={content} />
      </main>
    </div>
  );
}

function SharedContentBody({ content }: { content: SharedContentViewModel }) {
  if (content.imageSrc) {
    return (
      <Image
        alt={content.title}
        className="border-border bg-muted/30 h-auto w-full rounded-xl border object-contain"
        height={630}
        src={content.imageSrc}
        unoptimized
        width={1200}
      />
    );
  }

  if (content.bodyHtml) {
    return (
      <article
        className="prose prose-neutral dark:prose-invert max-w-none"
        // Stored post HTML is sanitized again before this render.
        dangerouslySetInnerHTML={{ __html: content.bodyHtml }}
      />
    );
  }

  if (content.text) {
    return (
      <p className="text-base leading-7 whitespace-pre-wrap">{content.text}</p>
    );
  }

  return (
    <p className="text-muted-foreground text-sm">This content is empty.</p>
  );
}

export function SharedContentUnavailable() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-4 text-center">
      <HugeiconsIcon
        className="text-muted-foreground size-8"
        icon={LockKeyIcon}
      />
      <h1 className="text-lg font-medium">This link is unavailable</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        The content may be private, or the link is no longer shared.
      </p>
    </div>
  );
}
