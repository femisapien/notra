import {
  siteIntegrationsSchema,
  siteSecuritySchema,
} from "@notra/sites-core/schemas/site-integrations";
import {
  siteBannerSchema,
  siteBlogSchema,
  siteChangelogSchema,
  siteContextualSchema,
  siteErrorsSchema,
  siteFooterSchema,
  siteLayoutSchema,
  siteMarkdownSchema,
  siteMetadataSchema,
  siteNavbarSchema,
  siteSeoSchema,
  siteThumbnailsSchema,
  siteVariablesSchema,
} from "@notra/sites-core/schemas/site-layout";
import { z } from "zod";

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const RELATIVE_OR_HTTP_URL = /^(?:\/(?!\/)|https?:\/\/|mailto:)/;

const redirectSchema = z.object({
  source: z.string().trim().startsWith("/"),
  destination: z
    .string()
    .trim()
    .regex(RELATIVE_OR_HTTP_URL, "Use an absolute https:// URL or a path"),
  permanent: z.boolean().default(true),
});

const SITE_PATH = z.string().trim().min(1).max(300);

/** An author's id in notra.json, used as `author: jan` in a post's frontmatter. */
export const SITE_AUTHOR_ID = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

/**
 * A person posts can name. The links become `sameAs` on the post's Person,
 * which is how search engines and AI answers tie the byline to a real profile.
 */
export const siteAuthorSchema = z.strictObject({
  name: z.string().trim().min(1).max(80),
  /** Role shown under the name, e.g. "Founder". */
  title: z.string().trim().max(80).optional(),
  /** Repository image (`/images/jan.jpg`) or an https URL. */
  avatar: z
    .string()
    .trim()
    .regex(
      /^(?:\/(?!\/)|https:\/\/)/,
      "Use a path like /images/jan.jpg or an https:// URL"
    )
    .optional(),
  bio: z.string().trim().max(300).optional(),
  /** Personal site or profile; the byline links here. */
  url: z.url().optional(),
  x: z.url().optional(),
  linkedin: z.url().optional(),
  github: z.url().optional(),
});
const imageByModeSchema = z.object({ light: SITE_PATH, dark: SITE_PATH });

const fontSpecSchema = z.object({
  /** A Google Fonts family name, or the name of the font in `source`. */
  family: z.string().trim().min(1).max(80),
  weight: z.number().int().min(100).max(900).optional(),
  /** Self-hosted font file in the repository (`/fonts/brand.woff2`) or an https URL. */
  source: z.string().trim().min(1).optional(),
  format: z.enum(["woff", "woff2"]).optional(),
});

const appearanceSchema = z
  .union([
    z.enum(["light", "dark", "system"]),
    z.object({
      default: z.enum(["light", "dark", "system"]).default("system"),
      /** Hide the light/dark toggle and always use `default`. */
      strict: z.boolean().default(false),
    }),
  ])
  .default("system")
  .transform((value) =>
    typeof value === "string" ? { default: value, strict: false } : value
  );

const shikiThemeName = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]+$/);

/**
 * `notra.json` at the repository (or configured root directory) root.
 * Origin and mounts are not part of it: they are verified in the dashboard,
 * so a commit can never point a site at a domain nobody checked.
 *
 * Three layers of customization: options here (brand, layout, chrome,
 * SEO), components in the repository (`header.mdx`, `footer.mdx`,
 * `slots/*.mdx`), and `style.css` / `script.js` for everything else.
 * Analytics come from `integrations` presets; custom JavaScript is limited by
 * the Content-Security-Policy in `security`. Every option is optional.
 */
export const siteConfigSchema = z.object({
  $schema: z.string().optional(),
  theme: z.enum(["notra"]).default("notra"),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional(),
  logo: z
    .union([
      SITE_PATH,
      imageByModeSchema.extend({
        href: z.string().trim().regex(RELATIVE_OR_HTTP_URL).optional(),
      }),
    ])
    .optional(),
  favicon: z.union([SITE_PATH, imageByModeSchema]).optional(),
  colors: z
    .object({
      /** Accent in light mode: links, active states, eyebrows. */
      primary: z.string().regex(HEX_COLOR).default("#8B5CF6"),
      /** Accent in dark mode; defaults to `primary`. */
      light: z.string().regex(HEX_COLOR).optional(),
      /** Buttons and hover states; defaults to `primary`. */
      dark: z.string().regex(HEX_COLOR).optional(),
    })
    .default({ primary: "#8B5CF6" }),
  appearance: appearanceSchema,
  fonts: fontSpecSchema
    .partial({ family: true })
    .extend({
      heading: fontSpecSchema.optional(),
      body: fontSpecSchema.optional(),
    })
    .optional(),
  background: z
    .object({
      decoration: z.enum(["none", "grid", "dots", "gradient"]).default("none"),
      /** A repository image behind every page, one per mode or shared. */
      image: z.union([SITE_PATH, imageByModeSchema]).optional(),
      color: z
        .object({
          light: z.string().regex(HEX_COLOR).optional(),
          dark: z.string().regex(HEX_COLOR).optional(),
        })
        .optional(),
    })
    .default({ decoration: "none" }),
  styling: z
    .object({
      codeblocks: z
        .union([
          z.enum(["system", "dark"]),
          shikiThemeName,
          z.object({ light: shikiThemeName, dark: shikiThemeName }),
        ])
        .default("system"),
    })
    .default({ codeblocks: "system" }),
  layout: siteLayoutSchema,
  banner: siteBannerSchema.optional(),
  navbar: siteNavbarSchema,
  footer: siteFooterSchema,
  /** People posts can name by id (`author: jan`); unknown names still show as plain text. */
  authors: z
    .record(
      z
        .string()
        .regex(
          SITE_AUTHOR_ID,
          "Use lowercase letters, digits and dashes for author ids"
        ),
      siteAuthorSchema
    )
    .default({}),
  blog: siteBlogSchema.optional(),
  changelog: siteChangelogSchema.optional(),
  contextual: siteContextualSchema,
  seo: siteSeoSchema,
  errors: siteErrorsSchema,
  thumbnails: siteThumbnailsSchema,
  metadata: siteMetadataSchema,
  markdown: siteMarkdownSchema,
  variables: siteVariablesSchema,
  redirects: z.array(redirectSchema).max(500).default([]),
  integrations: siteIntegrationsSchema,
  security: siteSecuritySchema,
});

export const blogFrontmatterSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  author: z.union([z.string(), z.array(z.string())]).optional(),
  image: z.string().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  noindex: z.boolean().default(false),
});

export const changelogFrontmatterSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  date: z.coerce.date(),
  version: z.string().trim().optional(),
  tags: z.array(z.string()).default([]),
  image: z.string().optional(),
  draft: z.boolean().default(false),
});
