import type { ResolvedAuthor } from "../types/authors";
import type { BlogEntry } from "../types/entries";
import { absoluteUrl, assetUrl, config, href } from "./params";

/** Path of an author's page in the blog: `/blog/author/jan`. */
export function authorHref(id: string): string {
  return href(`author/${id}`);
}

function knownAuthor(id: string): ResolvedAuthor | null {
  const author = config.authors[id];
  if (!author) {
    return null;
  }
  const links = [author.url, author.x, author.linkedin, author.github].filter(
    (link): link is string => Boolean(link)
  );
  return {
    id,
    name: author.name,
    title: author.title,
    bio: author.bio,
    avatar: assetUrl(author.avatar),
    href: authorHref(id),
    links,
    url: author.url ?? links[0],
  };
}

/** `author: jan` names a notra.json author; anything else is a plain name. */
export function resolveAuthor(value: string): ResolvedAuthor {
  return knownAuthor(value) ?? { id: null, name: value, links: [] };
}

export function authorsOf(entry: BlogEntry): ResolvedAuthor[] {
  const author = entry.data.author;
  if (!author) {
    return [];
  }
  return (Array.isArray(author) ? author : [author]).map(resolveAuthor);
}

/** Every author in notra.json, for author pages. */
export function allAuthors(): ResolvedAuthor[] {
  return Object.keys(config.authors)
    .map(knownAuthor)
    .filter((author): author is ResolvedAuthor => author !== null);
}

/** schema.org Person: the page and profiles that identify the author. */
export function personNode(author: ResolvedAuthor) {
  return {
    "@type": "Person",
    name: author.name,
    url: author.href ? absoluteUrl(author.href) : author.url,
    image: author.avatar ? absoluteUrl(author.avatar) : undefined,
    jobTitle: author.title,
    description: author.bio,
    sameAs: author.links.length > 0 ? author.links : undefined,
  };
}
