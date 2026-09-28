"use client";

import dynamic from "next/dynamic";
import { notFound, usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AnalyticsProvider } from "@/components/analytics/analytics-context";
import { DEMO_PROJECT } from "@/constants/demo/geo";
import { DEMO_ORGANIZATION } from "@/constants/demo/workspace";

const Geo = dynamic(() => import("@/app/(dashboard)/[slug]/geo/page-client"));
const Home = dynamic(() => import("@/app/(dashboard)/[slug]/page-client"));
const Content = dynamic(
  () => import("@/app/(dashboard)/[slug]/content/page-client")
);
const ContentDetail = dynamic(
  () => import("@/app/(dashboard)/[slug]/content/[id]/page-client")
);
const Collection = dynamic(
  () => import("@/app/(dashboard)/[slug]/collection/[id]/page-client")
);
const Prompts = dynamic(
  () => import("@/app/(dashboard)/[slug]/geo/prompts/page-client")
);
const Competitors = dynamic(
  () => import("@/app/(dashboard)/[slug]/geo/competitors/page-client")
);
const Gaps = dynamic(
  () => import("@/app/(dashboard)/[slug]/geo/gaps/page-client")
);
const Traffic = dynamic(
  () => import("@/app/(dashboard)/[slug]/geo/traffic/page-client")
);
const Personas = dynamic(
  () => import("@/app/(dashboard)/[slug]/geo/personas/page-client")
);
const Shelf = dynamic(
  () => import("@/app/(dashboard)/[slug]/geo/shelf-space/page-client")
);
const Readiness = dynamic(
  () => import("@/app/(dashboard)/[slug]/geo/agent-readiness/page-client")
);
const Brand = dynamic(
  () => import("@/app/(dashboard)/[slug]/brand/identity/page-client")
);
const Integrations = dynamic(
  () => import("@/app/(dashboard)/[slug]/integrations/page-client")
);
const Schedules = dynamic(
  () => import("@/app/(dashboard)/[slug]/automation/schedules/page-client")
);
const Events = dynamic(
  () => import("@/app/(dashboard)/[slug]/automation/events/page-client")
);
const Feedback = dynamic(
  () => import("@/app/(dashboard)/[slug]/feedback/page-client")
);
const Chat = dynamic(() => import("@/app/(dashboard)/[slug]/chat/page-client"));

const Analytics = dynamic(
  () => import("@/app/(dashboard)/[slug]/analytics/page-client")
);
const Skills = dynamic(
  () => import("@/app/(dashboard)/[slug]/skills/page-client")
);
const Iris = dynamic(() => import("@/app/(dashboard)/[slug]/iris/page-client"));
const ApiKeys = dynamic(() => import("@/app/(dashboard)/[slug]/api-keys/page"));

const Raycast = dynamic(
  () => import("@/app/(dashboard)/[slug]/integrations/raycast/page-client")
);

const Mcp = dynamic(
  () => import("@/app/(dashboard)/[slug]/integrations/mcp/page-client")
);

const Framer = dynamic(
  () => import("@/app/(dashboard)/[slug]/integrations/framer/page-client")
);

const Github = dynamic(
  () => import("@/app/(dashboard)/[slug]/integrations/github/page-client")
);

const Slack = dynamic(
  () => import("@/app/(dashboard)/[slug]/integrations/slack/page-client")
);

const Linear = dynamic(
  () => import("@/app/(dashboard)/[slug]/integrations/linear/page-client")
);

const Granola = dynamic(
  () => import("@/app/(dashboard)/[slug]/integrations/granola/page-client")
);

const SearchConsole = dynamic(
  () =>
    import("@/app/(dashboard)/[slug]/integrations/google-search-console/page-client")
);

const Write = dynamic(
  () => import("@/app/(dashboard)/[slug]/geo/write/page-client")
);

const SkillDetail = dynamic(
  () => import("@/app/(dashboard)/[slug]/skills/[name]/page-client")
);

export function DemoPages() {
  const pathname = usePathname();
  const path = pathname.slice("/demo".length);
  if (path.startsWith("/skills/")) {
    return (
      <SkillDetail
        slug="demo"
        name={path.split("/")[2] ?? ""}
        organizationId={DEMO_ORGANIZATION.id}
      />
    );
  }
  if (path.startsWith("/content/")) {
    return (
      <ContentDetail
        contentId={path.split("/")[2] ?? ""}
        organizationId={DEMO_ORGANIZATION.id}
        organizationSlug="demo"
      />
    );
  }
  if (path.startsWith("/collection/")) {
    return (
      <Collection
        collectionId={path.split("/")[2] ?? ""}
        organizationId={DEMO_ORGANIZATION.id}
        organizationSlug="demo"
      />
    );
  }
  const routes: Record<string, ReactNode> = {
    "": <Home greetingText="Good morning, Jamie" organizationSlug="demo" />,
    "/geo/prompts": <Prompts organizationSlug="demo" />,
    "/geo/competitors": <Competitors organizationSlug="demo" />,
    "/geo/write": <Write organizationSlug="demo" />,
    "/geo/gaps": <Gaps organizationSlug="demo" />,
    "/geo/traffic": <Traffic organizationSlug="demo" />,
    "/geo/personas": <Personas organizationSlug="demo" />,
    "/geo/shelf-space": <Shelf organizationSlug="demo" />,
    "/geo/agent-readiness": <Readiness organizationSlug="demo" />,
    "/content": (
      <Content initialProjectId={DEMO_PROJECT.id} organizationSlug="demo" />
    ),
    "/brand/identity": <Brand organizationSlug="demo" />,
    "/integrations/raycast": <Raycast organizationSlug="demo" />,
    "/integrations/mcp": <Mcp organizationSlug="demo" />,
    "/integrations/framer": <Framer organizationSlug="demo" />,
    "/integrations/github": <Github organizationSlug="demo" />,
    "/integrations/slack": <Slack organizationSlug="demo" />,
    "/integrations/linear": <Linear organizationSlug="demo" />,
    "/integrations/granola": <Granola organizationSlug="demo" />,
    "/integrations/google-search-console": (
      <SearchConsole organizationSlug="demo" />
    ),
    "/integrations": <Integrations organizationSlug="demo" />,
    "/automation/schedules": <Schedules organizationSlug="demo" />,
    "/automation/events": <Events organizationSlug="demo" />,
    "/feedback": <Feedback organizationSlug="demo" />,
    "/analytics": (
      <AnalyticsProvider organizationSlug="demo">
        <Analytics />
      </AnalyticsProvider>
    ),
    "/skills": <Skills slug="demo" organizationId={DEMO_ORGANIZATION.id} />,
    "/iris": <Iris organizationSlug="demo" />,
    "/api-keys": <ApiKeys />,
    "/chat": <Chat organizationSlug="demo" />,
    "/geo": <Geo organizationSlug="demo" />,
  };
  return routes[path] ?? notFound();
}
