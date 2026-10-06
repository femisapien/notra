import type { ChatTodoItem } from "@notra/ai/types/todos";

const PLAN = [
  "Research the bulk export feature",
  "Research the Slack alerts feature",
  "Write a changelog entry for bulk export",
  "Write a blog post about Slack alerts",
  "Write a LinkedIn post about both",
];

function plan(statuses: ChatTodoItem["status"][]): ChatTodoItem[] {
  return PLAN.map((content, index) => ({
    content,
    status: statuses[index] ?? "pending",
  }));
}

export const DESIGN_SYSTEM_TODO_STATES: {
  id: string;
  label: string;
  isActive: boolean;
  isStopped?: boolean;
  todos: ChatTodoItem[];
}[] = [
  {
    id: "planned",
    label: "Plan written",
    isActive: true,
    todos: plan(["in_progress"]),
  },
  {
    id: "running",
    label: "In progress",
    isActive: true,
    todos: plan(["completed", "completed", "in_progress"]),
  },
  {
    id: "stopped",
    label: "Reply stopped",
    isActive: false,
    isStopped: true,
    todos: plan(["completed", "completed", "in_progress"]),
  },
  {
    id: "done",
    label: "All done",
    isActive: false,
    todos: plan([
      "completed",
      "completed",
      "completed",
      "completed",
      "completed",
    ]),
  },
  {
    id: "edge",
    label: "Long and repeated items",
    isActive: true,
    todos: [
      {
        content:
          "Research how the new GEO shelf space report groups competitor citations across ChatGPT, Perplexity and Gemini",
        status: "completed",
      },
      { content: "Write a draft", status: "in_progress" },
      { content: "Write a draft", status: "pending" },
    ],
  },
];

/** Steps the live demo walks through, one per update call. */
export const DESIGN_SYSTEM_TODO_LIVE_STEPS: ChatTodoItem[][] = [
  plan(["in_progress"]),
  plan(["completed", "in_progress"]),
  plan(["completed", "completed", "in_progress"]),
  plan(["completed", "completed", "completed", "in_progress"]),
  plan(["completed", "completed", "completed", "completed", "in_progress"]),
  plan(["completed", "completed", "completed", "completed", "completed"]),
];

export const DESIGN_SYSTEM_TODO_LIVE_STEP_MS = 1400;
