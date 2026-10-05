"use client";

import {
  ArrowShrink01Icon,
  Cancel01Icon,
  FullScreenIcon,
  PlusSignIcon,
  SidebarRightIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { MessageResponse } from "@notra/ui/components/ai-elements/message";
import { Button } from "@notra/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { cn } from "@notra/ui/lib/utils";
import { useEffect, useEffectEvent } from "react";
import { useTranslations } from "use-intl";

import { RightPanel } from "@/components/dashboard/right-panel";
import { useRightPanel } from "@/components/dashboard/right-panel-context";
import Link from "@/components/framework/link";
import { useContent } from "@/lib/hooks/use-content";
import { useOutputTypeLabel } from "@/lib/hooks/use-output-type-label";
import type { ChatPostEntry } from "@/types/chat-posts";
import type {
  ChatContentPanelDocumentProps,
  ChatContentPanelProps,
  ChatContentPanelTabProps,
} from "@/types/components/chat-content-panel";
import { OutputTypeIcon } from "@/utils/output-types";

function isSocialPost(post: ChatPostEntry) {
  return (
    post.contentType === "twitter_post" || post.contentType === "linkedin_post"
  );
}

function ChatContentPanelDocument({
  onAskForChanges,
  organizationId,
  organizationSlug,
  post,
}: ChatContentPanelDocumentProps) {
  const t = useTranslations("chat.contentPanel");
  const tCommon = useTranslations("common");
  const tToolBlock = useTranslations("ai.toolBlock");
  const tPreview = useTranslations("ai.preview");
  const { data: savedPost } = useContent(organizationId, post.postId ?? "");
  const title =
    savedPost?.content.title ?? (post.title || tCommon("labels.untitled"));
  const markdown = savedPost?.content.markdown ?? post.markdown;
  const { postId } = post;

  let status = t("status.unsaved");
  if (post.state === "writing") {
    status = t("status.writing");
  } else if (postId) {
    status =
      savedPost?.content.status === "published"
        ? tCommon("labels.published")
        : t("status.draft");
  }

  return (
    <>
      <div
        aria-label={tPreview("contentRegion", { type: title })}
        className="bg-background mx-2 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-lg border px-6 py-6 focus-visible:outline-none"
        role="region"
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- The scrollable preview must be reachable for keyboard scrolling.
        tabIndex={0}
      >
        <article className="mx-auto w-full max-w-[42rem]">
          <h1 className="text-foreground mb-4 text-xl leading-snug font-semibold text-balance">
            {title}
          </h1>
          {isSocialPost(post) ? (
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {markdown}
            </p>
          ) : (
            <MessageResponse
              className="text-sm leading-relaxed"
              isAnimating={post.state === "writing"}
              mode={post.state === "writing" ? undefined : "static"}
            >
              {markdown}
            </MessageResponse>
          )}
        </article>
      </div>
      <footer className="flex h-12 shrink-0 items-center justify-between gap-2 px-4">
        <span
          aria-live="polite"
          className="text-muted-foreground truncate text-xs"
        >
          {status}
        </span>
        {postId ? (
          <div className="-mr-1.5 flex items-center gap-1">
            <Button
              onClick={() => onAskForChanges({ ...post, postId, title })}
              size="sm"
              variant="ghost"
            >
              {tPreview("askForChanges")}
            </Button>
            <Button
              nativeButton={false}
              render={<Link href={`/${organizationSlug}/content/${postId}`} />}
              size="sm"
              variant="secondary"
            >
              {tToolBlock("openInEditor")}
            </Button>
          </div>
        ) : null}
      </footer>
    </>
  );
}

function ChatContentPanelTab({
  isActive,
  onActivate,
  onClose,
  post,
}: ChatContentPanelTabProps) {
  const t = useTranslations("chat.contentPanel");
  const tCommon = useTranslations("common");
  const title = post.title || tCommon("labels.untitled");

  return (
    <div
      className={cn(
        "group/tab flex h-8 max-w-48 min-w-24 items-center rounded-md text-sm transition-colors",
        isActive
          ? "bg-background text-foreground shadow-xs"
          : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
      )}
    >
      <button
        aria-selected={isActive}
        className="focus-visible:ring-ring flex h-full min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-md pl-2.5 outline-none focus-visible:ring-2"
        onClick={onActivate}
        role="tab"
        title={title}
        type="button"
      >
        <OutputTypeIcon
          className="size-3.5 shrink-0"
          outputType={post.contentType}
        />
        <span className="truncate">{title}</span>
      </button>
      <button
        aria-label={t("closeTab", { title })}
        className={cn(
          "text-muted-foreground hover:text-foreground focus-visible:ring-ring mr-1 ml-0.5 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded outline-none focus-visible:ring-2",
          isActive
            ? "opacity-100"
            : "opacity-0 group-hover/tab:opacity-100 focus-visible:opacity-100"
        )}
        onClick={onClose}
        type="button"
      >
        <HugeiconsIcon className="size-3" icon={Cancel01Icon} strokeWidth={2} />
      </button>
    </div>
  );
}

export function ChatContentPanel({
  activeToolCallId,
  onActivateTab,
  onAskForChanges,
  onCloseTab,
  onOpenTab,
  openToolCallIds,
  organizationId,
  organizationSlug,
  posts,
}: ChatContentPanelProps) {
  const t = useTranslations("chat.contentPanel");
  const tCommon = useTranslations("common");
  const getOutputTypeLabel = useOutputTypeLabel();
  const { closePanel, expanded, toggleExpanded } = useRightPanel();
  const postsById = new Map(posts.map((post) => [post.toolCallId, post]));
  const openPosts = openToolCallIds.flatMap((id) => {
    const post = postsById.get(id);
    return post ? [post] : [];
  });
  const closedPosts = posts.filter(
    (post) => !openToolCallIds.includes(post.toolCallId)
  );
  const activePost = openPosts.find(
    (post) => post.toolCallId === activeToolCallId
  );

  // The panel belongs to this chat; leaving it must not leave the slot open.
  const closeOnLeave = useEffectEvent(() => closePanel("preview"));
  useEffect(() => () => closeOnLeave(), []);

  return (
    <RightPanel id="preview" size="wide">
      <header className="flex h-12 shrink-0 items-center gap-1 pr-2 pl-2">
        <div
          aria-label={t("title")}
          className="flex min-w-0 shrink scrollbar-none items-center gap-1 overflow-x-auto"
          role="tablist"
        >
          {openPosts.map((post) => (
            <ChatContentPanelTab
              isActive={post.toolCallId === activePost?.toolCallId}
              key={post.toolCallId}
              onActivate={() => onActivateTab(post.toolCallId)}
              onClose={() => onCloseTab(post.toolCallId)}
              post={post}
            />
          ))}
        </div>
        <TooltipProvider>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    className="inline-flex shrink-0"
                    disabled={closedPosts.length === 0}
                    render={<Button size="icon-sm" variant="ghost" />}
                  />
                }
              >
                <span className="sr-only">{t("openTab")}</span>
                <HugeiconsIcon
                  className="size-4"
                  icon={PlusSignIcon}
                  strokeWidth={1.8}
                />
              </TooltipTrigger>
              <TooltipContent>{t("openTab")}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-72" sideOffset={6}>
              {closedPosts.map((post) => (
                <DropdownMenuItem
                  key={post.toolCallId}
                  onClick={() => onOpenTab(post.toolCallId)}
                >
                  <OutputTypeIcon
                    className="size-3.5 shrink-0"
                    outputType={post.contentType}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {post.title || tCommon("labels.untitled")}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {getOutputTypeLabel(post.contentType)}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-pressed={expanded}
                    onClick={toggleExpanded}
                    size="icon-sm"
                    variant="ghost"
                  />
                }
              >
                <span className="sr-only">
                  {expanded ? t("collapse") : t("expand")}
                </span>
                <HugeiconsIcon
                  className="size-4"
                  icon={expanded ? ArrowShrink01Icon : FullScreenIcon}
                  strokeWidth={1.8}
                />
              </TooltipTrigger>
              <TooltipContent>
                {expanded ? t("collapse") : t("expand")}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    onClick={() => closePanel("preview")}
                    size="icon-sm"
                    variant="ghost"
                  />
                }
              >
                <span className="sr-only">{t("close")}</span>
                <HugeiconsIcon
                  className="size-4"
                  icon={SidebarRightIcon}
                  strokeWidth={1.8}
                />
              </TooltipTrigger>
              <TooltipContent>{t("close")}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </header>
      {activePost ? (
        <ChatContentPanelDocument
          key={activePost.toolCallId}
          onAskForChanges={onAskForChanges}
          organizationId={organizationId}
          organizationSlug={organizationSlug}
          post={activePost}
        />
      ) : (
        <p className="text-muted-foreground px-4 text-sm">{t("empty")}</p>
      )}
    </RightPanel>
  );
}
