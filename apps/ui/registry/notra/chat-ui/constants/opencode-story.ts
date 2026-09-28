import type { OpencodeSource } from "../types/brainless-opencode";

export const OPENCODE_STORY_SESSION = {
  title: "OpenCode — ~/acme/web",
  userMessage: "draft a changelog from this week's merged PRs and post it",
  assistantMessage:
    "I'll pull the week's merged work, draft the changelog in your voice, and publish it.",
  activities: [
    {
      id: "prepare",
      kind: "thought" as const,
      label: "Preparing changelog workflow",
      duration: "1.4s",
    },
    {
      id: "events",
      kind: "tool" as const,
      label: "notra_list_events",
      detail: "range=week",
    },
    {
      id: "websearch",
      kind: "tool" as const,
      label: "websearch",
      detail: "query=this week's product announcements",
    },
    {
      id: "draft",
      kind: "thought" as const,
      label: "Drafting in brand voice",
      duration: "4.2s",
    },
    {
      id: "publish",
      kind: "tool" as const,
      label: "notra_publish_post",
      detail: "type=changelog",
    },
  ],
  resultMessage: "Published. Drafted in your voice from 14 PRs in 22 seconds.",
  promptPlaceholder: 'Ask anything... "Draft a launch post"',
  cwd: "~/acme/web",
  context: "26.2K (7%)",
  tokens: "26,167 tokens",
  used: "7% used",
  servers: [
    { name: "notra", status: "Connected" as const },
    { name: "github", status: "Connected" as const },
    { name: "linear", status: "Connected" as const },
  ],
};

export const OPENCODE_STORY_SOURCES: OpencodeSource[] = [
  { title: "ChatGPT", domain: "chatgpt.com", url: "https://chatgpt.com/" },
  { title: "Claude", domain: "claude.ai", url: "https://claude.ai/" },
  { title: "Jasper", domain: "jasper.ai", url: "https://www.jasper.ai/" },
  { title: "Canva", domain: "canva.com", url: "https://www.canva.com/" },
  { title: "Adobe", domain: "adobe.com", url: "https://www.adobe.com/" },
  {
    title: "Descript",
    domain: "descript.com",
    url: "https://www.descript.com/",
  },
  {
    title: "Gemini",
    domain: "support.google.com",
    url: "https://support.google.com/",
  },
];
