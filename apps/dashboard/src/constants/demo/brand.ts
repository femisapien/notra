import { DEMO_BRAND } from "@/constants/demo/workspace";
import type {
  SitemapListResponse,
  SitemapPagesResponse,
} from "@/types/hooks/brand-sitemaps";
export const DEMO_SITEMAP_PAGES: SitemapPagesResponse = {
  pages: [
    ["/docs/introduction/branching", "Database branching"],
    ["/docs/introduction/autoscaling", "Autoscaling compute"],
    ["/docs/connect/connect-from-any-app", "Connect from your application"],
    ["/docs/guides/nextjs", "Build with Next.js"],
    ["/docs/guides/drizzle", "Use Drizzle with Postgres"],
    ["/pricing", "Plans and pricing"],
  ].map(([path, title], index) => ({
    id: `demo-sitemap-page-${index}`,
    sitemapId: "demo-sitemap",
    url: `https://neon.com${path}`,
    path: path ?? "/",
    title: title ?? null,
    category: "crawled",
    statusCode: 200,
    redirectTarget: null,
    wordCount: 680 + index * 143,
    textRatio: 0.72,
    internalLinks: 12 + index * 3,
    externalLinks: 2,
    crawledAt: "2026-09-27T06:00:00Z",
  })),
  counts: { crawled: 6, queued: 0, failed: 0, redirect: 0 },
  hasMore: false,
  nextCursor: null,
};
export const DEMO_SITEMAPS: SitemapListResponse = {
  sitemaps: [
    {
      id: "demo-sitemap",
      brandSettingsId: DEMO_BRAND.id,
      label: "Developer documentation",
      url: "https://neon.com/sitemap.xml",
      hostname: "neon.com",
      status: "ready",
      totalPages: 6,
      indexedPages: 6,
      failedPages: 0,
      lastCrawledAt: "2026-09-27T06:00:00Z",
      createdAt: "2026-09-03T06:00:00Z",
      updatedAt: "2026-09-27T06:00:00Z",
    },
  ],
};
