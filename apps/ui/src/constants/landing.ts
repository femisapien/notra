import type { LandingSection } from "../types/landing";

export const LANDING_SECTIONS: LandingSection[] = [
  {
    items: [
      {
        description: "A muted header band tucked behind the content card.",
        href: "/components/tooltip",
        preview: "tooltip",
        title: "Tooltip",
      },
      {
        description: "Messages, reasoning and composer.",
        href: "/components/chatgpt-ui",
        title: "ChatGPT UI",
      },
      {
        description: "Messages, search and composer.",
        href: "/components/claude-chat-ui",
        title: "Claude Chat UI",
      },
      {
        description: "Messages and composer.",
        href: "/components/gemini-ui",
        title: "Gemini UI",
      },
      {
        description: "Search, citations and composer.",
        href: "/components/perplexity-ui",
        title: "Perplexity UI",
      },
      {
        description: "Terminal messages, sources and composer.",
        href: "/components/opencode-ui",
        title: "OpenCode UI",
      },
    ],
    title: "Components",
  },
  {
    items: [
      {
        description:
          "Google's AI Overview with highlights, citation chips and a collapsible Show more.",
        href: "/blocks/google-ai-overview",
        preview: "ai-overview",
        title: "Google AI Overview",
      },
      {
        description: "A complete ChatGPT conversation layout.",
        href: "/blocks/chatgpt-chat",
        title: "ChatGPT Chat",
      },
      {
        description: "A complete Claude conversation layout.",
        href: "/blocks/claude-chat",
        title: "Claude Chat",
      },
      {
        description: "A complete Gemini conversation layout.",
        href: "/blocks/gemini-chat",
        title: "Gemini Chat",
      },
      {
        description: "A complete Perplexity conversation layout.",
        href: "/blocks/perplexity-chat",
        title: "Perplexity Chat",
      },
      {
        description: "An OpenCode terminal layout.",
        href: "/blocks/opencode-chat",
        title: "OpenCode Chat",
      },
      {
        description: "The centered OpenCode start screen.",
        href: "/blocks/opencode-start",
        title: "OpenCode Start",
      },
    ],
    title: "Blocks",
  },
];
