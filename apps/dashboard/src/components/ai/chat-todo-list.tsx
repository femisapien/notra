"use client";

import {
  CheckmarkCircle02Icon,
  CircleIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ChatTodoItem } from "@notra/ai/types/todos";
import { cn } from "@notra/ui/lib/utils";
import { useTranslations } from "use-intl";

import type { ChatTodoListProps } from "@/types/components/chat-todo-list";

function TodoStatusIcon({
  status,
  isActive,
}: {
  status: ChatTodoItem["status"];
  isActive: boolean;
}) {
  if (status === "completed") {
    return (
      <HugeiconsIcon
        className="text-success size-3.5 shrink-0"
        icon={CheckmarkCircle02Icon}
        strokeWidth={1.8}
      />
    );
  }
  if (status === "in_progress" && isActive) {
    return (
      <HugeiconsIcon
        className="text-foreground size-3.5 shrink-0 animate-spin motion-reduce:animate-none"
        icon={Loading03Icon}
        strokeWidth={1.8}
      />
    );
  }
  return (
    <HugeiconsIcon
      className="text-muted-foreground/60 size-3.5 shrink-0"
      icon={CircleIcon}
      strokeWidth={1.8}
    />
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

export function ChatTodoList({ todos, isActive }: ChatTodoListProps) {
  const t = useTranslations("chat.todos");
  const completed = todos.filter((todo) => todo.status === "completed").length;

  return (
    <section
      aria-label={t("label")}
      className="border-border bg-background w-full max-w-xl rounded-lg border px-3.5 py-3"
    >
      <h3 className="text-muted-foreground mb-2 flex items-center justify-between text-xs">
        <span>{t("label")}</span>
        <span className="tabular-nums">
          {t("progress", { completed, total: todos.length })}
        </span>
      </h3>
      <ol className="flex flex-col gap-1.5">
        {withTodoKeys(todos).map(({ key, todo }) => (
          <li className="flex items-start gap-2 text-sm leading-5" key={key}>
            <span className="flex h-5 items-center">
              <TodoStatusIcon isActive={isActive} status={todo.status} />
            </span>
            <span
              className={cn(
                "min-w-0 text-pretty",
                todo.status === "completed" &&
                  "text-muted-foreground line-through decoration-1",
                todo.status === "in_progress" && "text-foreground font-medium"
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
