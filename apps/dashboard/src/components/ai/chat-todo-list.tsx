"use client";

import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  CircleIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ChatTodoItem } from "@notra/ai/types/todos";
import { cn } from "@notra/ui/lib/utils";
import { useTranslations } from "use-intl";

import type { ChatTodoListProps } from "@/types/components/chat-todo-list";

const ICON_LAYER_CLASSNAME =
  "absolute inset-0 size-3.5 transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-none";

// All icons stay mounted and crossfade, so a status change never pops.
function TodoStatusIcon({
  status,
  isActive,
  isStopped,
}: {
  status: ChatTodoItem["status"];
  isActive: boolean;
  isStopped: boolean;
}) {
  const isCompleted = status === "completed";
  const isSpinning = status === "in_progress" && isActive;
  const isInterrupted = status === "in_progress" && !isActive && isStopped;
  const isOpen = !(isCompleted || isSpinning || isInterrupted);

  return (
    <span aria-hidden="true" className="relative size-3.5 shrink-0">
      <HugeiconsIcon
        className={cn(
          ICON_LAYER_CLASSNAME,
          "text-muted-foreground/50",
          isOpen ? "scale-100 opacity-100" : "scale-75 opacity-0"
        )}
        icon={CircleIcon}
        strokeWidth={1.8}
      />
      <HugeiconsIcon
        className={cn(
          ICON_LAYER_CLASSNAME,
          "text-foreground",
          isSpinning
            ? "scale-100 animate-spin opacity-100 motion-reduce:animate-none"
            : "scale-75 opacity-0"
        )}
        icon={Loading03Icon}
        strokeWidth={1.8}
      />
      <HugeiconsIcon
        className={cn(
          ICON_LAYER_CLASSNAME,
          "text-warning",
          isInterrupted ? "scale-100 opacity-100" : "scale-75 opacity-0"
        )}
        icon={Alert02Icon}
        strokeWidth={1.8}
      />
      <HugeiconsIcon
        className={cn(
          ICON_LAYER_CLASSNAME,
          "text-success",
          isCompleted ? "scale-100 opacity-100" : "scale-50 opacity-0"
        )}
        icon={CheckmarkCircle02Icon}
        strokeWidth={1.8}
      />
    </span>
  );
}

// Items have no ids; the content is the identity, numbered when repeated.
function withTodoKeys(todos: ChatTodoItem[]) {
  const seen = new Map<string, number>();
  return todos.map((todo) => {
    const count = seen.get(todo.content) ?? 0;
    seen.set(todo.content, count + 1);
    return { key: count ? `${todo.content}#${count}` : todo.content, todo };
  });
}

export function ChatTodoList({
  todos,
  isActive,
  isStopped = false,
}: ChatTodoListProps) {
  const t = useTranslations("chat.todos");
  const showStopped = isStopped && !isActive;

  return (
    <section
      aria-label={t("label")}
      className="border-shell-border bg-shell w-full max-w-xl rounded-2xl border p-0.5 pt-0"
    >
      <header className="flex items-center justify-between gap-3 px-2.5 py-2">
        <h3 className="text-foreground text-xs font-medium">{t("label")}</h3>
        <span
          className={cn(
            "text-warning flex items-center gap-1 text-xs transition-opacity duration-200 motion-reduce:transition-none",
            showStopped ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={!showStopped}
        >
          <HugeiconsIcon
            className="size-3"
            icon={Alert02Icon}
            strokeWidth={1.8}
          />
          {t("stopped")}
        </span>
      </header>
      <ol className="border-border bg-background flex flex-col gap-1.5 rounded-[14px] border px-3 py-2.5">
        {withTodoKeys(todos).map(({ key, todo }) => (
          <li className="flex items-start gap-2 text-sm leading-5" key={key}>
            <span className="flex h-5 items-center">
              <TodoStatusIcon
                isActive={isActive}
                isStopped={showStopped}
                status={todo.status}
              />
            </span>
            <span
              className={cn(
                "min-w-0 text-pretty line-through decoration-1 transition-[color,text-decoration-color] duration-300 ease-out motion-reduce:transition-none",
                todo.status === "completed"
                  ? "text-muted-foreground decoration-muted-foreground"
                  : "decoration-transparent",
                todo.status === "pending" &&
                  (showStopped
                    ? "text-muted-foreground"
                    : "text-foreground/80"),
                todo.status === "in_progress" &&
                  (showStopped ? "text-foreground/80" : "text-foreground")
              )}
            >
              {todo.content}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
