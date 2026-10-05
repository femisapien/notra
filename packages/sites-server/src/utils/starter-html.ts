import {
  STARTER_CTA_LABEL,
  STARTER_MAX_FOOTER_LINKS,
  STARTER_MAX_LABEL_LENGTH,
  STARTER_MAX_NAV_LINKS,
  STARTER_MAX_URL_LENGTH,
  STARTER_RAW_TEXT_ELEMENTS,
  STARTER_SOCIAL_HOSTS,
  STARTER_VOID_ELEMENTS,
} from "../constants/starter";
import type {
  LandingPageFacts,
  StarterLink,
  StarterSocialPlatform,
} from "../types/starter";
import { normalizeHexColor } from "./starter-color";

/**
 * A deliberately small HTML reader for one landing page: it only needs tags,
 * attributes and text, never a DOM. Malformed markup degrades to fewer facts,
 * not to an error.
 */
const TAG =
  /<!--[\s\S]*?-->|<![^>]*>|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>/g;
const ATTRIBUTE =
  /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const ENTITY = /&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi;
const WHITESPACE = /\s+/g;
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  middot: "·",
  copy: "©",
};

type HtmlToken =
  | { kind: "open"; name: string; attrs: Map<string, string>; void: boolean }
  | { kind: "close"; name: string }
  | { kind: "text"; text: string };

interface Frame {
  name: string;
  hidden: boolean;
}

interface CapturedAnchor {
  href: string;
  label: string;
  hidden: boolean;
  menuItem: boolean;
  inHeader: boolean;
  inNav: boolean;
  footerIndex: number | null;
}

interface OpenAnchor {
  href: string;
  ariaLabel: string;
  hidden: boolean;
  menuItem: boolean;
  text: string[];
  svgTitle: string[];
  inHeader: boolean;
  inNav: boolean;
  footerIndex: number | null;
}

interface IconCandidate {
  href: string;
  rel: string;
  type: string;
  size: number;
}

export function decodeHtmlEntities(value: string): string {
  return value.replace(ENTITY, (match, decimal, hex, name) => {
    if (decimal) {
      return safeCodePoint(Number.parseInt(decimal, 10)) ?? match;
    }
    if (hex) {
      return safeCodePoint(Number.parseInt(hex, 16)) ?? match;
    }
    return NAMED_ENTITIES[String(name).toLowerCase()] ?? match;
  });
}

function safeCodePoint(code: number): string | null {
  return Number.isInteger(code) && code > 0 && code <= 0x10_ff_ff
    ? String.fromCodePoint(code)
    : null;
}

function parseAttributes(source: string): Map<string, string> {
  const attrs = new Map<string, string>();
  for (const match of source.matchAll(ATTRIBUTE)) {
    const name = match[1]?.toLowerCase();
    if (!name || attrs.has(name)) {
      continue;
    }
    attrs.set(name, decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? ""));
  }
  return attrs;
}

export function* tokenizeHtml(html: string): Generator<HtmlToken> {
  const tag = new RegExp(TAG.source, "g");
  let last = 0;
  let match = tag.exec(html);
  while (match) {
    if (match.index > last) {
      yield { kind: "text", text: html.slice(last, match.index) };
    }
    last = tag.lastIndex;
    const [, closeName, openName, rawAttrs, selfClosing] = match;
    if (closeName) {
      yield { kind: "close", name: closeName.toLowerCase() };
    } else if (openName) {
      const name = openName.toLowerCase();
      const isVoid = STARTER_VOID_ELEMENTS.has(name) || selfClosing === "/";
      yield {
        kind: "open",
        name,
        attrs: parseAttributes(rawAttrs ?? ""),
        void: isVoid,
      };
      // Script and style bodies are not markup; jump to their end tag.
      if (STARTER_RAW_TEXT_ELEMENTS.has(name) && !isVoid) {
        const end = html.toLowerCase().indexOf(`</${name}`, last);
        const resume = end === -1 ? html.length : end;
        last = resume;
        tag.lastIndex = resume;
      }
    }
    match = tag.exec(html);
  }
  if (last < html.length) {
    yield { kind: "text", text: html.slice(last) };
  }
}

function collapse(value: string): string {
  return decodeHtmlEntities(value).replace(WHITESPACE, " ").trim();
}

/** An absolute http(s)/mailto URL, or null for anchors, scripts and junk. */
export function resolveLinkUrl(
  href: string,
  baseUrl: string,
  options: { httpsOnly?: boolean } = {}
): string | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(trimmed, baseUrl);
  } catch {
    return null;
  }
  const allowed = options.httpsOnly
    ? url.protocol === "https:"
    : ["https:", "http:", "mailto:"].includes(url.protocol);
  if (!allowed || url.username || url.password) {
    return null;
  }
  url.hash = "";
  const value = url.href;
  // Quotes and braces would need escaping in MDX attributes; such URLs are skipped.
  if (value.length > STARTER_MAX_URL_LENGTH || /["'<>{}`\\]/.test(value)) {
    return null;
  }
  return value;
}

/** `https://` in front of a bare domain; plain http is upgraded, never fetched. */
export function normalizeWebsiteUrl(value: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed.replace(/^http:\/\//i, "https://")
    : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function socialPlatform(url: string): StarterSocialPlatform | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
  for (const [domain, platform] of STARTER_SOCIAL_HOSTS) {
    if (host === domain || host.endsWith(`.${domain}`)) {
      return platform;
    }
  }
  return null;
}

function isHomeLink(url: string, pageUrl: string): boolean {
  try {
    const target = new URL(url);
    const page = new URL(pageUrl);
    const bare = (host: string) => host.replace(/^www\./, "");
    return (
      bare(target.hostname) === bare(page.hostname) &&
      (target.pathname === "/" || target.pathname === "") &&
      !target.search
    );
  } catch {
    return false;
  }
}

function clampLabel(label: string): string | null {
  if (!label) {
    return null;
  }
  // A long "label" is a card or a sentence, not a navigation link.
  return label.length > STARTER_MAX_LABEL_LENGTH ? null : label;
}

/** Google Fonts family names from a css / css2 stylesheet URL. */
export function googleFontFamilies(href: string): string[] {
  let url: URL;
  try {
    url = new URL(href, "https://fonts.googleapis.com");
  } catch {
    return [];
  }
  if (url.hostname !== "fonts.googleapis.com") {
    return [];
  }
  const families: string[] = [];
  for (const value of url.searchParams.getAll("family")) {
    // css2: one family per parameter; css (v1): `A:400,700|B`.
    for (const part of value.split("|")) {
      const family = part.split(":")[0]?.trim();
      if (family && !families.includes(family)) {
        families.push(family);
      }
    }
  }
  return families;
}

function iconSize(sizes: string): number {
  const match = /(\d+)x(\d+)/i.exec(sizes);
  return match ? Number(match[1]) : 0;
}

function pickIcon(icons: IconCandidate[]): string | null {
  const svg = icons.find(
    (icon) => icon.type === "image/svg+xml" || /\.svg(?:$|\?)/i.test(icon.href)
  );
  if (svg) {
    return svg.href;
  }
  const touch = icons.find((icon) => icon.rel.includes("apple-touch-icon"));
  if (touch) {
    return touch.href;
  }
  const [largest] = [...icons].sort((a, b) => b.size - a.size);
  return largest?.href ?? null;
}

function dedupeLinks(links: StarterLink[], limit: number): StarterLink[] {
  const seen = new Set<string>();
  const result: StarterLink[] = [];
  for (const link of links) {
    if (seen.has(link.href)) {
      continue;
    }
    seen.add(link.href);
    result.push(link);
    if (result.length >= limit) {
      break;
    }
  }
  return result;
}

function isHiddenElement(attrs: Map<string, string>): boolean {
  return (
    attrs.get("aria-hidden") === "true" ||
    attrs.has("hidden") ||
    attrs.has("inert")
  );
}

/**
 * Reads the facts the starter needs from a landing page: name, icon, colors,
 * Google Fonts, header links and footer links. URLs come back absolute.
 */
export function extractLandingPage(
  html: string,
  pageUrl: string
): LandingPageFacts {
  const facts: LandingPageFacts = {
    title: null,
    siteName: null,
    description: null,
    headerLogoUrl: null,
    iconUrl: null,
    themeColor: null,
    themeColorLight: null,
    themeColorDark: null,
    fontFamilies: [],
    navLinks: [],
    cta: null,
    footerLinks: [],
    socials: {},
  };
  let baseUrl = pageUrl;
  const stack: Frame[] = [];
  const icons: IconCandidate[] = [];
  const anchors: CapturedAnchor[] = [];
  let anchor: OpenAnchor | null = null;
  let titleText: string[] | null = null;
  // Depth of the first <header> / <nav>; -1 before, null once closed.
  let headerDepth: number | null = -1;
  let navDepth: number | null = -1;
  let footerDepth: number | null = null;
  let footerCount = 0;
  let svgDepth: number | null = null;
  let svgTitleDepth: number | null = null;

  const inRegion = (depth: number | null) =>
    depth !== null && depth >= 0 && stack.length > depth;

  for (const token of tokenizeHtml(html)) {
    if (token.kind === "text") {
      if (titleText) {
        titleText.push(token.text);
      }
      if (anchor) {
        if (svgTitleDepth !== null) {
          anchor.svgTitle.push(token.text);
        } else if (svgDepth === null) {
          anchor.text.push(token.text);
        }
      }
      continue;
    }

    if (token.kind === "close") {
      const index = stack.findLastIndex((frame) => frame.name === token.name);
      if (index === -1) {
        continue;
      }
      stack.length = index;
      if (token.name === "title" && titleText) {
        facts.title ??= collapse(titleText.join("")) || null;
        titleText = null;
      }
      if (svgTitleDepth !== null && stack.length <= svgTitleDepth) {
        svgTitleDepth = null;
      }
      if (svgDepth !== null && stack.length <= svgDepth) {
        svgDepth = null;
      }
      if (token.name === "a" && anchor) {
        const label = clampLabel(
          collapse(anchor.text.join("")) ||
            anchor.ariaLabel ||
            collapse(anchor.svgTitle.join(""))
        );
        anchors.push({
          href: anchor.href,
          label: label ?? "",
          hidden: anchor.hidden,
          menuItem: anchor.menuItem,
          inHeader: anchor.inHeader,
          inNav: anchor.inNav,
          footerIndex: anchor.footerIndex,
        });
        anchor = null;
      }
      if (
        headerDepth !== null &&
        headerDepth >= 0 &&
        stack.length <= headerDepth
      ) {
        headerDepth = null;
      }
      if (navDepth !== null && navDepth >= 0 && stack.length <= navDepth) {
        navDepth = null;
      }
      if (footerDepth !== null && stack.length <= footerDepth) {
        footerDepth = null;
      }
      continue;
    }

    const { name, attrs } = token;
    const parentHidden = stack.at(-1)?.hidden ?? false;
    const hidden = parentHidden || isHiddenElement(attrs);

    if (name === "base" && attrs.get("href")) {
      baseUrl = resolveLinkUrl(attrs.get("href") ?? "", pageUrl) ?? baseUrl;
    } else if (name === "link") {
      const rel = (attrs.get("rel") ?? "").toLowerCase();
      const href = attrs.get("href") ?? "";
      if (
        rel
          .split(/\s+/)
          .some(
            (value) => value === "icon" || value.startsWith("apple-touch-icon")
          )
      ) {
        const resolved = resolveLinkUrl(href, baseUrl, { httpsOnly: true });
        if (resolved) {
          icons.push({
            href: resolved,
            rel,
            type: (attrs.get("type") ?? "").toLowerCase(),
            size: iconSize(attrs.get("sizes") ?? ""),
          });
        }
      } else if (href.includes("fonts.googleapis.com")) {
        for (const family of googleFontFamilies(href)) {
          if (!facts.fontFamilies.includes(family)) {
            facts.fontFamilies.push(family);
          }
        }
      }
    } else if (name === "meta") {
      readMeta(attrs, facts);
    } else if (name === "img" && inRegion(headerDepth) && !hidden) {
      facts.headerLogoUrl ??= resolveLinkUrl(attrs.get("src") ?? "", baseUrl, {
        httpsOnly: true,
      });
    }

    if (token.void) {
      continue;
    }
    stack.push({ name, hidden });

    if (name === "title" && svgDepth !== null) {
      svgTitleDepth = stack.length - 1;
    } else if (name === "title" && !titleText && facts.title === null) {
      titleText = [];
    } else if (name === "header" && headerDepth === -1) {
      headerDepth = stack.length - 1;
    } else if (name === "nav" && navDepth === -1) {
      navDepth = stack.length - 1;
    } else if (name === "footer" && footerDepth === null) {
      footerDepth = stack.length - 1;
      footerCount += 1;
    } else if (name === "svg" && svgDepth === null) {
      svgDepth = stack.length - 1;
    } else if (name === "a" && !anchor) {
      const href = resolveLinkUrl(attrs.get("href") ?? "", baseUrl);
      if (href) {
        anchor = {
          href,
          ariaLabel: collapse(attrs.get("aria-label") ?? ""),
          hidden,
          menuItem: (attrs.get("role") ?? "").startsWith("menuitem"),
          text: [],
          svgTitle: [],
          inHeader: inRegion(headerDepth),
          inNav: inRegion(navDepth),
          footerIndex: footerDepth === null ? null : footerCount,
        };
      }
    }
  }

  facts.iconUrl = pickIcon(icons);
  collectHeaderLinks(anchors, pageUrl, facts);
  collectFooterLinks(anchors, footerCount, facts);
  return facts;
}

function readMeta(attrs: Map<string, string>, facts: LandingPageFacts): void {
  const key = (attrs.get("name") ?? attrs.get("property") ?? "").toLowerCase();
  const content = collapse(attrs.get("content") ?? "");
  if (!content) {
    return;
  }
  if (key === "theme-color") {
    const color = normalizeHexColor(content);
    const media = (attrs.get("media") ?? "").toLowerCase();
    if (media.includes("dark")) {
      facts.themeColorDark ??= color;
    } else if (media.includes("light")) {
      facts.themeColorLight ??= color;
    } else {
      facts.themeColor ??= color;
    }
  } else if (key === "og:site_name" || key === "application-name") {
    facts.siteName ??= content;
  } else if (key === "description" || key === "og:description") {
    facts.description ??= content;
  }
}

/** The first <header> holds the real navigation; the first <nav> is the fallback. */
function collectHeaderLinks(
  anchors: CapturedAnchor[],
  pageUrl: string,
  facts: LandingPageFacts
): void {
  const usable = (candidate: CapturedAnchor) =>
    !(candidate.hidden || candidate.menuItem) &&
    candidate.label !== "" &&
    !isHomeLink(candidate.href, pageUrl);
  const inHeader = anchors.filter(
    (candidate) => candidate.inHeader && usable(candidate)
  );
  const candidates =
    inHeader.length > 0
      ? inHeader
      : anchors.filter((candidate) => candidate.inNav && usable(candidate));
  const links: StarterLink[] = [];
  for (const candidate of candidates) {
    const link = { label: candidate.label, href: candidate.href };
    if (STARTER_CTA_LABEL.test(candidate.label)) {
      // The last call to action wins; landing pages put the primary one last.
      facts.cta = link;
      continue;
    }
    links.push(link);
  }
  facts.navLinks = dedupeLinks(
    links.filter((link) => link.href !== facts.cta?.href),
    STARTER_MAX_NAV_LINKS
  );
}

/** The last <footer> is the page footer; earlier ones belong to articles or cards. */
function collectFooterLinks(
  anchors: CapturedAnchor[],
  footerCount: number,
  facts: LandingPageFacts
): void {
  const inFooter = anchors.filter(
    (candidate) => candidate.footerIndex === footerCount && !candidate.hidden
  );
  const links: StarterLink[] = [];
  for (const candidate of inFooter) {
    const platform = socialPlatform(candidate.href);
    if (platform) {
      facts.socials[platform] ??= candidate.href;
      continue;
    }
    if (candidate.label) {
      links.push({ label: candidate.label, href: candidate.href });
    }
  }
  facts.footerLinks = dedupeLinks(links, STARTER_MAX_FOOTER_LINKS);
}
