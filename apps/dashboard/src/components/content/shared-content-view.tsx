import { HugeiconsIcon } from "@hugeicons/react";
import { supportsPostSlug } from "@notra/ai/schemas/post";
import { Notra } from "@notra/ui/components/ui/svgs/notra";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/empty-state";
import { getContentShareOption } from "@/constants/content-share";
import type { SharedContentViewModel } from "@/types/content-share";
import { formatArticleDate } from "@/utils/format";

const LONG_FORM_TYPES = new Set(["blog_post", "changelog"]);

const SHARED_ARTICLE_CLASS =
  "[&_p]:mb-4 [&_p]:text-base [&_p]:leading-relaxed [&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:font-semibold [&_h1]:text-2xl [&_h1]:tracking-tight [&_h1:first-child]:mt-0 [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:font-semibold [&_h2]:text-xl [&_h2]:tracking-tight [&_h2:first-child]:mt-0 [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-lg [&_h3]:tracking-tight [&_ul]:my-4 [&_ul]:ml-0 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ol]:my-4 [&_ol]:ml-0 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_li]:text-base [&_li]:leading-relaxed [&_blockquote]:text-muted-foreground [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-base [&_blockquote]:leading-relaxed [&_blockquote]:italic [&_code]:bg-muted [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_pre]:bg-secondary/50 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:p-4 [&_pre]:text-sm [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_a]:text-primary [&_a]:underline [&_a]:hover:no-underline [&_hr]:bg-border [&_hr]:my-4 [&_hr]:h-0.5 [&_hr]:border-none [&_img]:my-6 [&_img]:h-auto [&_img]:w-full [&_img]:rounded-lg [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_th]:border-border [&_th]:bg-muted [&_th]:border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold [&_td]:border-border [&_td]:border [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm";

function SharedContentFrame({
  children,
  trailing,
}: {
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="bg-sidebar min-h-dvh">
      <div className="bg-background flex min-h-dvh flex-col md:m-2 md:min-h-[calc(100dvh-1rem)] md:rounded-xl md:border md:shadow-[0_1px_2px_rgba(0,0,0,0.04)] md:dark:shadow-none">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <header className="bg-secondary sticky top-0 z-20 flex shrink-0 items-center gap-x-4 px-4 py-3 lg:px-6">
            <div
              aria-hidden="true"
              className="bg-secondary pointer-events-none absolute inset-x-0 top-full h-4"
            >
              <div className="bg-background h-full rounded-t-2xl" />
            </div>
            <Link
              className="flex h-8 items-center gap-2"
              href="https://usenotra.com"
            >
              <span className="bg-background flex size-7 shrink-0 items-center justify-center rounded-lg dark:bg-[#F6F3F1]">
                <Notra className="size-7 dark:size-5" />
              </span>
              <span className="text-base font-semibold">Notra</span>
            </Link>
            {trailing}
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}

function SharedContentHeader({ content }: { content: SharedContentViewModel }) {
  const showSlug = supportsPostSlug(content.contentType) && content.slug;

  return (
    <div className="w-full">
      <h1 className="text-2xl leading-tight font-semibold tracking-tight md:text-3xl">
        {content.title}
      </h1>
      <div className="text-muted-foreground mt-4 space-y-2 text-sm">
        {showSlug ? (
          <p className="font-mono text-xs leading-5 sm:text-sm">
            /{content.slug}
          </p>
        ) : null}
        <time className="mt-2 block" dateTime={content.date}>
          {formatArticleDate(new Date(content.date))}
        </time>
      </div>
    </div>
  );
}

function SharedContentBody({ content }: { content: SharedContentViewModel }) {
  if (content.imageSrc) {
    return (
      <Image
        alt={content.title}
        className="h-auto max-h-[calc(100vh-260px)] w-full object-contain"
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
        className={SHARED_ARTICLE_CLASS}
        dangerouslySetInnerHTML={{ __html: content.bodyHtml }}
      />
    );
  }

  if (content.text) {
    return (
      <p className="text-base leading-relaxed whitespace-pre-wrap">
        {content.text}
      </p>
    );
  }

  return (
    <p className="text-muted-foreground text-sm">This content is empty.</p>
  );
}

export function SharedContentView({
  content,
}: {
  content: SharedContentViewModel;
}) {
  const isLongForm = LONG_FORM_TYPES.has(content.contentType);
  const unlisted = getContentShareOption("unlisted");

  return (
    <SharedContentFrame
      trailing={
        <p className="text-muted-foreground ml-auto flex items-center gap-1.5 text-sm">
          <HugeiconsIcon className="size-4" icon={unlisted.icon} />
          {unlisted.label}
        </p>
      }
    >
      <div className="flex flex-1 flex-col py-4 md:py-6">
        <div
          className={`mx-auto w-full space-y-8 px-4 lg:px-6 ${isLongForm ? "max-w-3xl" : "max-w-5xl"}`}
        >
          <SharedContentHeader content={content} />
          <SharedContentBody content={content} />
          <div className="h-24" />
        </div>
      </div>
    </SharedContentFrame>
  );
}

export function SharedContentUnavailable() {
  return (
    <SharedContentFrame>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-5xl">
          <EmptyState
            description="The content may be private, or the link is no longer shared."
            title="This link is unavailable"
          />
        </div>
      </div>
    </SharedContentFrame>
  );
}
