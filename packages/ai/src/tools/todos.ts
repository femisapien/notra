import { chatTodoListSchema } from "@notra/ai/schemas/todos";
import { toolDescription } from "@notra/ai/utils/description";
import { type Tool, tool } from "ai";

export const UPDATE_TODOS_TOOL_NAME = "updateTodos";

/**
 * A plan the model keeps for long, multi-deliverable requests. It stores
 * nothing: the list lives in the tool call, and the chat renders the latest
 * one as a checklist.
 */
export function createUpdateTodosTool(): Tool {
  return tool({
    description: toolDescription({
      toolName: UPDATE_TODOS_TOOL_NAME,
      intro:
        "Writes your plan as a short checklist the user can follow while you work.",
      whenToUse:
        "Only for requests with three or more separate deliverables or research steps, for example content about several features at once. Do not use it for a single post, a revision, or a question.",
      usageNotes:
        "Send the full list every call. Call it once with the plan before starting, then only when an item finishes or the plan changes. Keep at most one item in_progress. Mark everything completed before your final answer.",
    }),
    inputSchema: chatTodoListSchema,
    execute: ({ todos }) => ({
      remaining: todos.filter((todo) => todo.status !== "completed").length,
    }),
  });
}
