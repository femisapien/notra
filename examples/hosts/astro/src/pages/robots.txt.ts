import type { APIRoute } from "astro";

// /robots.txt belongs to this website, so it lists the section sitemaps that Notra serves.
export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? "";
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${origin}/blog/sitemap.xml`,
    `Sitemap: ${origin}/changelog/sitemap.xml`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
};
