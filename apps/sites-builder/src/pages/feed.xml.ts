import type { APIRoute } from "astro";

import { authorsOf } from "../lib/authors";
import { getBlogEntries, getChangelogEntries } from "../lib/entries";
import {
  absoluteUrl,
  areaDescription,
  areaTitle,
  config,
  href,
  params,
} from "../lib/params";
import type { BlogEntry, ChangelogEntry } from "../types/entries";
import { excerpt } from "../utils/excerpt";
import { escapeXml } from "../utils/xml";

function authors(entry: BlogEntry | ChangelogEntry): string[] {
  return entry.collection === "blog"
    ? authorsOf(entry).map((author) => author.name)
    : [];
}

export const GET: APIRoute = async () => {
  const entries =
    params.area === "blog"
      ? await getBlogEntries()
      : await getChangelogEntries();
  const published = entries.filter((entry) => !entry.data.draft);
  const items = published
    .map((entry) => {
      const link = absoluteUrl(href(entry.id));
      const summary = entry.data.description ?? excerpt(entry.body);
      const description = summary
        ? `<description>${escapeXml(summary)}</description>`
        : "";
      const creators = authors(entry)
        .map((name) => `<dc:creator>${escapeXml(name)}</dc:creator>`)
        .join("");
      const categories = entry.data.tags
        .map((tag) => `<category>${escapeXml(tag)}</category>`)
        .join("");
      return `<item><title>${escapeXml(entry.data.title)}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><pubDate>${entry.data.date.toUTCString()}</pubDate>${description}${creators}${categories}</item>`;
    })
    .join("");
  const lastBuild = published[0]
    ? `<lastBuildDate>${published[0].data.date.toUTCString()}</lastBuildDate>`
    : "";
  const channelLink = absoluteUrl(href());
  // Readers list feeds by title: "Changelog" alone says nothing next to other feeds.
  const title = areaTitle(params.area).startsWith(config.name)
    ? areaTitle(params.area)
    : `${config.name} ${areaTitle(params.area)}`;
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>${escapeXml(title)}</title><link>${channelLink}</link><description>${escapeXml(areaDescription(params.area) ?? areaTitle(params.area))}</description><language>en</language>${lastBuild}<atom:link href="${absoluteUrl(href("feed.xml"))}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
};
