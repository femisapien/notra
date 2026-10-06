import {
  DEFAULT_THEME_COLORS,
  PROPERTY_META_TAG,
  TOUCH_ICON_EXTENSIONS,
  X_HOSTS,
} from "../constants/seo";
import type { ExtraMetaTag, JsonLdNode, SocialImage } from "../types/seo";
import {
  absoluteUrl,
  areaTitle,
  assetUrl,
  config,
  href,
  params,
} from "./params";
import { faviconFor, logoFor } from "./theme";

const origin = new URL(params.publicOrigin).origin;
const ORGANIZATION_ID = `${origin}/#organization`;
const WEBSITE_ID = `${origin}/#website`;

/** `<title>`: "Post · Acme"; an area named after the site stays "Acme Blog", not "Acme Blog · Acme". */
export function pageTitle(title: string, isAreaIndex = false): string {
  const named = title === config.name || title.startsWith(`${config.name} `);
  return isAreaIndex && named ? title : `${title} · ${config.name}`;
}

/** The area's own node id, so entries can say which blog or changelog they belong to. */
export function areaNodeId(): string {
  return `${absoluteUrl(href())}#${params.area}`;
}

/**
 * The publisher: the customer's company, linked to its profiles from `footer.socials`,
 * or exactly what `seo.organization` says when the derived one is wrong (legal name, parent company).
 */
function organization(): JsonLdNode {
  const override = config.seo.organization;
  if (override) {
    const logo = assetUrl(override.logo);
    return {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: override.name,
      legalName: override.legalName,
      url: override.url ?? `${origin}/`,
      logo: logo
        ? { "@type": "ImageObject", url: absoluteUrl(logo) }
        : undefined,
      sameAs: override.sameAs.length > 0 ? override.sameAs : undefined,
    };
  }
  const logo = logoFor("light");
  const companyUrl =
    typeof config.logo === "object" && config.logo.href
      ? absoluteUrl(config.logo.href)
      : `${origin}/`;
  const sameAs = socialUrls();
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: config.name,
    url: companyUrl,
    logo: logo ? { "@type": "ImageObject", url: absoluteUrl(logo) } : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}

function socialUrls(): string[] {
  return Object.values(config.footer.socials).filter(
    (url): url is string => typeof url === "string"
  );
}

/** The Notra site itself: the root mount, else the first mounted area. */
function website(): JsonLdNode {
  const home =
    params.mounts.blog === "/" || params.mounts.changelog === "/"
      ? "/"
      : (params.mounts.blog ?? params.mounts.changelog ?? "/");
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: config.name,
    description: config.description,
    url: absoluteUrl(home),
    inLanguage: "en",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function publisherRef(): JsonLdNode {
  return { "@id": ORGANIZATION_ID };
}

export function websiteRef(): JsonLdNode {
  return { "@id": WEBSITE_ID };
}

/** Area index → page, as search results show it. */
export function breadcrumbs(title: string, url: string): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: areaTitle(params.area),
        item: absoluteUrl(href()),
      },
      { "@type": "ListItem", position: 2, name: title, item: url },
    ],
  };
}

/** One JSON-LD document per page: the page's own nodes plus the publisher and website. */
export function structuredData(nodes: JsonLdNode[]): string {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [...nodes, website(), organization()],
  };
  // `<` would let content close the script element.
  return JSON.stringify(graph).replaceAll("<", "\\u003c");
}

/**
 * The page's share image: its cover, else the generated thumbnail, else the site
 * logo. Platforms crop a logo badly into a large card, so only the first two get
 * `summary_large_image`.
 */
export function socialImage(
  image: string | undefined,
  generated?: string
): SocialImage | undefined {
  if (image) {
    return { url: absoluteUrl(assetUrl(image) ?? image), large: true };
  }
  if (generated) {
    return { url: absoluteUrl(generated), large: true };
  }
  const logo = logoFor("light");
  return logo ? { url: absoluteUrl(logo), large: false } : undefined;
}

/** `seo.metatags`: Open Graph style keys (`og:`, `article:`, `fb:`) are properties, the rest names. */
export function extraMetaTags(): ExtraMetaTag[] {
  return Object.entries(config.seo.metatags).map(([value, content]) => ({
    key: PROPERTY_META_TAG.test(value) ? "property" : "name",
    value,
    content,
  }));
}

/** `@acme` from an x.com / twitter.com profile URL in `footer.socials`. */
export function twitterHandle(): string | undefined {
  for (const url of socialUrls()) {
    try {
      const parsed = new URL(url);
      const handle = parsed.pathname.split("/").find(Boolean);
      if (X_HOSTS.has(parsed.hostname) && handle) {
        return `@${handle}`;
      }
    } catch {
      // Validated as URLs by notra.json; skip anything odd.
    }
  }
  return undefined;
}

/** Browser chrome color, matching the page background in each mode. */
export function themeColors(): { light: string; dark: string } {
  return {
    light: config.background.color?.light ?? DEFAULT_THEME_COLORS.light,
    dark: config.background.color?.dark ?? DEFAULT_THEME_COLORS.dark,
  };
}

/** iOS home screen icon: the favicon or logo, when it is a raster image (iOS ignores SVG). */
export function touchIcon(): string | undefined {
  return [faviconFor("light"), logoFor("light")].find(
    (path) => path && TOUCH_ICON_EXTENSIONS.test(path)
  );
}
