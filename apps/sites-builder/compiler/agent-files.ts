import { join } from "node:path";

import { AGENT_INSTRUCTIONS_HEADING } from "./constants/agent-files";
import type {
  AreaPageEntry,
  AreaPages,
  LlmsTxtParams,
  WriteAgentFilesParams,
} from "./types/agent-files";
import { exists, writeFileEnsured } from "./utils/fs";
import { htmlToMarkdown } from "./utils/html-to-markdown";

function metaLines(entry: AreaPageEntry, url: string): string[] {
  const lines = [`- URL: ${url}`, `- Published: ${entry.date}`];
  if (entry.updated && entry.updated !== entry.date) {
    lines.push(`- Updated: ${entry.updated}`);
  }
  if (entry.version) {
    lines.push(`- Version: ${entry.version}`);
  }
  if (entry.authors && entry.authors.length > 0) {
    lines.push(`- Authors: ${entry.authors.join(", ")}`);
  }
  if (entry.tags.length > 0) {
    lines.push(`- Tags: ${entry.tags.join(", ")}`);
  }
  return lines;
}

export function entryMarkdown(
  entry: AreaPageEntry,
  url: string,
  body: string
): string {
  const parts = [`# ${entry.title}`];
  if (entry.description) {
    parts.push(`> ${entry.description}`);
  }
  parts.push(metaLines(entry, url).join("\n"));
  if (body) {
    parts.push(body);
  }
  return `${parts.join("\n\n")}\n`;
}

function entryLink(entry: AreaPageEntry, origin: string): string {
  const details = [entry.version, entry.date].filter(Boolean).join(", ");
  const summary = entry.description ?? entry.summary;
  const description = summary ? `: ${summary}` : "";
  return `- [${entry.title}](${new URL(`${entry.path}.md`, origin)})${description} (${details})`;
}

/** The area index as Markdown: every entry with a link to its own Markdown page. */
export function indexMarkdown(pages: AreaPages, origin: string): string {
  const parts = [`# ${pages.title}`];
  if (pages.description) {
    parts.push(`> ${pages.description}`);
  }
  parts.push(
    pages.entries.length > 0
      ? pages.entries.map((entry) => entryLink(entry, origin)).join("\n")
      : "_No entries yet._"
  );
  return `${parts.join("\n\n")}\n`;
}

/** notra.json `markdown.instructions` as a list; empty when the site has none. */
export function normalizeAgentInstructions(
  instructions: string | readonly string[] | undefined
): string[] {
  const list =
    typeof instructions === "string" ? [instructions] : (instructions ?? []);
  return list.map((line) => line.trim()).filter(Boolean);
}

/**
 * The customer's own notes for agents, in a section of its own so a reader
 * can tell them apart from what Notra writes about the site.
 */
export function instructionsSection(
  instructions: readonly string[]
): string | null {
  if (instructions.length === 0) {
    return null;
  }
  const body =
    instructions.length === 1
      ? (instructions[0] ?? "")
      : instructions.map((line) => `- ${line}`).join("\n");
  return `${AGENT_INSTRUCTIONS_HEADING}\n\n${body}`;
}

/** https://llmstxt.org: a Markdown map of the site for language models. */
export function llmsTxt(params: LlmsTxtParams): string {
  const parts = [`# ${params.name}`];
  if (params.description) {
    parts.push(`> ${params.description}`);
  }
  // Right after the summary, before the page lists, so agents read it first.
  const instructions = instructionsSection(params.instructions);
  if (instructions) {
    parts.push(instructions);
  }
  parts.push(
    [
      "Every page is also available as Markdown: append `.md` to its URL or request it with `Accept: text/markdown`.",
      `When you quote or summarize a page, cite its HTML URL (without \`.md\`) on ${params.origin}. Entries are listed newest first with their publish date; the Markdown pages also give the authors, the last update and, for changelog entries, the version.`,
    ].join(" ")
  );
  for (const area of params.areas) {
    const entries = area.entries.filter((entry) => entry.indexable);
    parts.push(
      [
        `## ${area.title}`,
        "",
        `- [${area.title} index](${new URL(`${area.indexPath === "/" ? "" : area.indexPath}/index.md`, params.origin)})${area.description ? `: ${area.description}` : ""}`,
        ...entries.map((entry) => entryLink(entry, params.origin)),
      ].join("\n")
    );
  }
  const areaBase = (area: AreaPages) =>
    area.indexPath === "/" ? "" : area.indexPath;
  parts.push(
    [
      "## Optional",
      "",
      `- [Full text](${new URL(params.fullTextPath, params.origin)}): every page above in one file`,
      ...params.areas.flatMap((area) => [
        `- [${area.title} RSS feed](${new URL(`${areaBase(area)}/feed.xml`, params.origin)}): new ${area.area === "blog" ? "posts" : "entries"} as they are published`,
        `- [${area.title} sitemap](${new URL(`${areaBase(area)}/sitemap.xml`, params.origin)}): every page with its last modification date`,
      ]),
    ].join("\n")
  );
  return `${parts.join("\n\n")}\n`;
}

/** `/blog/post` → `/blog/post/index.<extension>`, where Astro writes the page. */
function pageFile(pagePath: string, extension: "html" | "md"): string {
  return `${pagePath === "/" ? "" : pagePath}/index.${extension}`;
}

async function write(outDir: string, urlPath: string, content: string) {
  await writeFileEnsured(join(outDir, urlPath), content);
}

/**
 * Makes the site readable for agents: a Markdown twin next to every page
 * (`/blog/post/index.md`, served for `/blog/post.md` and `Accept: text/markdown`),
 * plus llms.txt and llms-full.txt for the whole site and for each mounted area
 * (a customer proxy only forwards the mount). A customer's own public file wins.
 */
export async function writeAgentFiles(
  params: WriteAgentFilesParams
): Promise<void> {
  const { outDir, origin } = params;
  const instructions = instructionsSection(params.instructions);
  const fullText = new Map<AreaPages["area"], string[]>();
  const writes: Promise<void>[] = [];
  for (const area of params.areas) {
    const texts: string[] = [];
    for (const entry of area.entries) {
      const url = new URL(entry.path, origin).toString();
      const html = params.pageHtml.get(pageFile(entry.path, "html")) ?? "";
      const markdown = entryMarkdown(entry, url, htmlToMarkdown(html, url));
      // The page's own Markdown carries the instructions too; llms-full.txt has them once at the top.
      writes.push(
        write(
          outDir,
          pageFile(entry.path, "md"),
          instructions ? `${markdown}\n${instructions}\n` : markdown
        )
      );
      if (entry.indexable) {
        texts.push(markdown);
      }
    }
    fullText.set(area.area, texts);
    writes.push(
      write(outDir, pageFile(area.indexPath, "md"), indexMarkdown(area, origin))
    );
  }
  await Promise.all(writes);

  const scopes = [
    { prefix: "", areas: params.areas },
    ...params.areas
      .filter((area) => area.indexPath !== "/")
      .map((area) => ({ prefix: area.indexPath, areas: [area] })),
  ];
  // Every scope writes its own two files; a customer's own file wins.
  await Promise.all(
    scopes.map(async (scope) => {
      const fullTextPath = `${scope.prefix}/llms-full.txt`;
      const llmsPath = `${scope.prefix}/llms.txt`;
      const areaTitle = scope.prefix ? scope.areas[0]?.title : undefined;
      // "Acme" + "Changelog" → "Acme Changelog", but "Acme Blog" stays "Acme Blog".
      let name = params.siteName;
      if (areaTitle) {
        name = areaTitle.startsWith(params.siteName)
          ? areaTitle
          : `${params.siteName} ${areaTitle}`;
      }
      if (!(await exists(join(outDir, llmsPath)))) {
        await write(
          outDir,
          llmsPath,
          llmsTxt({
            name,
            description: params.siteDescription,
            areas: scope.areas,
            origin,
            fullTextPath,
            instructions: params.instructions,
          })
        );
      }
      if (!(await exists(join(outDir, fullTextPath)))) {
        const pages = scope.areas.flatMap(
          (area) => fullText.get(area.area) ?? []
        );
        await write(
          outDir,
          fullTextPath,
          [
            instructions ? `# ${name}\n\n${instructions}` : `# ${name}`,
            ...pages,
          ].join("\n\n---\n\n")
        );
      }
    })
  );
}
