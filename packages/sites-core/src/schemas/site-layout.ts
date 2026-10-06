import {
  SITE_HEX_COLOR,
  SITE_ICON_NAME,
  SITE_LINK_HREF,
} from "@notra/sites-core/constants/site-config";
import {
  SITE_CONTEXTUAL_OPTIONS,
  SITE_NAVBAR_LINK_TYPES,
  SITE_SOCIAL_PLATFORMS,
} from "@notra/sites-core/constants/site-layout";
import { z } from "zod";

/** A repository path or URL; notra.json caps both at 300 characters. */
export const sitePathSchema = z.string().trim().min(1).max(300);

const href = z
  .string()
  .trim()
  .regex(SITE_LINK_HREF, "Use an absolute https:// URL or a path");
const icon = z
  .string()
  .trim()
  .regex(SITE_ICON_NAME, "Use a Lucide icon name like book-open");
const colorByMode = z.union([
  z.string().regex(SITE_HEX_COLOR),
  z.object({
    light: z.string().regex(SITE_HEX_COLOR),
    dark: z.string().regex(SITE_HEX_COLOR),
  }),
]);

const siteLinkSchema = z.object({
  label: z.string().trim().min(1).max(60),
  href,
  icon: icon.optional(),
});

/** A navbar link: a labelled link, or a typed one (`github`, `discord`) that brings its own icon. */
const siteNavbarLinkSchema = z.union([
  siteLinkSchema,
  z.object({
    type: z.enum(SITE_NAVBAR_LINK_TYPES),
    href: z.url(),
    label: z.string().trim().min(1).max(60).optional(),
  }),
]);

export const siteNavbarSchema = z
  .object({
    links: z.array(siteNavbarLinkSchema).max(8).default([]),
    /** The highlighted button on the right. */
    cta: siteLinkSchema.optional(),
    /** A typed link shown as a button next to the CTA, e.g. the GitHub star button. */
    primary: z
      .object({ type: z.enum(SITE_NAVBAR_LINK_TYPES), href: z.url() })
      .optional(),
  })
  .default({ links: [] });

const footerColumnSchema = z.object({
  header: z.string().trim().min(1).max(60).optional(),
  items: z.array(siteLinkSchema).min(1).max(12),
});

/**
 * Footer links: a flat list (one column) or columns with a header each.
 * Socials are keyed by platform and render as icons.
 */
export const siteFooterSchema = z
  .object({
    links: z
      .union([
        z.array(siteLinkSchema).max(16),
        z.array(footerColumnSchema).max(6),
      ])
      .default([]),
    socials: z
      .partialRecord(z.enum(SITE_SOCIAL_PLATFORMS), z.url())
      .default({}),
  })
  .default({ links: [], socials: {} });

/** An announcement bar across the top of every page. */
export const siteBannerSchema = z.object({
  /** One line of Markdown: links, bold and italic. */
  content: z.string().trim().min(1).max(300),
  dismissible: z.boolean().default(false),
  type: z.enum(["info", "warning", "critical"]).default("info"),
  /** Overrides the color `type` implies; text stays white. */
  color: colorByMode.optional(),
});

/** The "Copy article / Open in" actions on every post. */
export const siteContextualSchema = z
  .object({
    options: z
      .array(
        z.union([
          z.enum(SITE_CONTEXTUAL_OPTIONS),
          z.object({
            title: z.string().trim().min(1).max(60),
            description: z.string().trim().max(120).optional(),
            icon: icon.optional(),
            /** `{url}` and `{markdownUrl}` are replaced with the page's URLs. */
            href: z
              .string()
              .trim()
              .max(500)
              .regex(
                /^(?:https?:\/\/|\/(?!\/)|mailto:)/,
                "Use an https:// URL or a path; {url} and {markdownUrl} are filled in"
              ),
          }),
        ])
      )
      .max(12)
      .default([
        "copy",
        "view",
        "chatgpt",
        "claude",
        "t3chat",
        "perplexity",
        "grok",
      ]),
    /** `meta`: in the post's date line; `none`: hidden. */
    display: z.enum(["meta", "none"]).default("meta"),
  })
  .default({
    options: [
      "copy",
      "view",
      "chatgpt",
      "claude",
      "t3chat",
      "perplexity",
      "grok",
    ],
    display: "meta",
  });

export const siteSeoSchema = z
  .object({
    /** Extra `<meta>` tags on every page, by name or property. */
    metatags: z
      .record(z.string().regex(/^[a-z][a-z0-9:_.-]*$/i), z.string().max(500))
      .default({}),
    /** `navigable`: index pages and entries; `all` also lets search engines index author pages. */
    indexing: z.enum(["navigable", "all"]).default("navigable"),
    /** Replaces the publisher derived from `name`, `logo` and `footer.socials` in structured data. */
    organization: z
      .object({
        name: z.string().trim().min(1).max(120),
        legalName: z.string().trim().max(160).optional(),
        url: z.url().optional(),
        logo: sitePathSchema.optional(),
        sameAs: z.array(z.url()).max(12).default([]),
      })
      .optional(),
  })
  .default({ metatags: {}, indexing: "navigable" });

export const siteErrorsSchema = z
  .object({
    404: z
      .object({
        title: z.string().trim().max(120).optional(),
        description: z.string().trim().max(300).optional(),
        /** Send unknown paths to the area index instead of showing the page. */
        redirect: z.boolean().default(false),
      })
      .default({ redirect: false }),
  })
  .default({ 404: { redirect: false } });

/** Generated share images for posts without a cover. */
export const siteThumbnailsSchema = z
  .object({
    enabled: z.boolean().default(true),
    appearance: z.enum(["light", "dark"]).default("light"),
    /** A repository image drawn behind the title. */
    background: sitePathSchema.optional(),
    /** Defaults to the heading font. */
    font: z.string().trim().max(80).optional(),
  })
  .default({ enabled: true, appearance: "light" });

export const siteMarkdownSchema = z
  .object({
    /** Added to llms.txt and every Markdown page, for AI agents reading the site. */
    instructions: z
      .union([
        z.string().trim().max(2000),
        z.array(z.string().trim().max(500)).max(20),
      ])
      .optional(),
  })
  .default({});

/** `{{ name }}` in posts, slots, header and footer is replaced with the value. */
export const siteVariablesSchema = z
  .record(
    z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,39}$/),
    z.string().max(500)
  )
  .default({});

export const siteLayoutSchema = z
  .object({
    /** Widest content column, in rem, or `full`; match the landing page. */
    width: z
      .union([z.number().min(40).max(120), z.literal("full")])
      .default(72),
  })
  .default({ width: 72 });

const blogHeroSchema = z
  .object({
    style: z.enum(["wash", "plain", "image", "none"]).default("wash"),
    /** Small line above the title. */
    eyebrow: z.string().trim().max(60).optional(),
    /** Used by the `image` style. */
    image: sitePathSchema.optional(),
  })
  .default({ style: "wash" });

export const siteBlogSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(400).optional(),
  layout: z.enum(["grid", "list", "magazine"]).default("grid"),
  hero: blogHeroSchema,
  /** Pinned at the top: the newest post, none, or these slugs in order. */
  featured: z
    .union([
      z.enum(["latest", "none"]),
      z.array(z.string().trim().min(1)).max(6),
    ])
    .default("none"),
  card: z
    .object({
      image: z.boolean().default(false),
      excerpt: z.boolean().default(true),
      author: z.boolean().default(true),
      date: z.boolean().default(true),
      readingTime: z.boolean().default(false),
    })
    .default({
      image: false,
      excerpt: true,
      author: true,
      date: true,
      readingTime: false,
    }),
  post: z
    .object({
      toc: z.boolean().default(true),
      authorCard: z.boolean().default(true),
      readingTime: z.boolean().default(true),
      pagination: z.boolean().default(true),
      width: z.enum(["narrow", "wide"]).default("wide"),
    })
    .default({
      toc: true,
      authorCard: true,
      readingTime: true,
      pagination: true,
      width: "wide",
    }),
});

export const siteChangelogSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(400).optional(),
  layout: z.enum(["timeline", "cards", "compact"]).default("timeline"),
  hero: blogHeroSchema,
});

export const siteMetadataSchema = z
  .object({
    /** Show "Updated" dates from `updated` in frontmatter. */
    timestamp: z.boolean().default(true),
  })
  .default({ timestamp: true });
