import { SITE_AUTHOR_ID } from "@notra/sites-core/constants/site-config";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

import {
  CONTENT_AUTHOR_BIO_MAX_LENGTH,
  CONTENT_AUTHOR_LINK_MAX_LENGTH,
  CONTENT_AUTHOR_NAME_MAX_LENGTH,
  CONTENT_AUTHOR_TITLE_MAX_LENGTH,
  POST_AUTHORS_MAX,
  POST_COVER_ALT_MAX_LENGTH,
  POST_COVER_URL_MAX_LENGTH,
  POST_EXCERPT_MAX_LENGTH,
  POST_TAG_MAX_LENGTH,
  POST_TAGS_MAX,
} from "../../constants/dashboard/post-metadata";

/**
 * An https URL, or a path to Notra's own upload route. Plain http is
 * rejected: hosted sites are https-only and refuse mixed content.
 */
const mediaUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(POST_COVER_URL_MAX_LENGTH)
  .refine(
    (value) =>
      value.startsWith("/api/uploads/") || /^https:\/\/[^\s]+$/i.test(value),
    { error: "Use an https URL or an uploaded image" }
  );

export const postCoverImageSchema = z.object({
  url: mediaUrlSchema,
  alt: z.string().trim().max(POST_COVER_ALT_MAX_LENGTH).default(""),
});

export const postTagSchema = z.string().trim().min(1).max(POST_TAG_MAX_LENGTH);

/** Trims, drops empties and case-insensitive duplicates, keeps first spelling. */
export const postTagsSchema = z
  .array(postTagSchema)
  .max(POST_TAGS_MAX)
  .transform((tags) => {
    const seen = new Set<string>();
    return tags.filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  });

export const postAuthorIdsSchema = z
  .array(z.string().trim().min(1).max(64))
  .max(POST_AUTHORS_MAX)
  .transform((ids) => [...new Set(ids)]);

/** Empty or null: derive the summary from the first paragraph again. */
export const postExcerptPatchSchema = z
  .string()
  .trim()
  .max(POST_EXCERPT_MAX_LENGTH)
  .nullable();

/** YYYY-MM-DD; null falls back to the publish date. */
export const postDisplayDatePatchSchema = z.iso.date().nullable();

/** Every field optional: send only what changed. */
export const postMetadataPatchSchema = z
  .object({
    coverImage: postCoverImageSchema.nullable().optional(),
    tags: postTagsSchema.optional(),
    excerpt: postExcerptPatchSchema.optional(),
    authorIds: postAuthorIdsSchema.optional(),
    featured: z.boolean().optional(),
    noindex: z.boolean().optional(),
    displayDate: postDisplayDatePatchSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });

export type PostMetadataPatch = z.infer<typeof postMetadataPatchSchema>;

export const postMetadataSchema = z.object({
  coverImage: postCoverImageSchema.nullable(),
  tags: z.array(z.string()),
  excerpt: z.string().nullable(),
  authorIds: z.array(z.string()),
  featured: z.boolean(),
  noindex: z.boolean(),
  displayDate: z.string().nullable(),
});

export type PostMetadata = z.infer<typeof postMetadataSchema>;

const optionalLinkSchema = z
  .string()
  .trim()
  .max(CONTENT_AUTHOR_LINK_MAX_LENGTH)
  .refine((value) => value === "" || /^https?:\/\/[^\s]+$/i.test(value), {
    error: "Use a full https link",
  })
  .transform((value) => value || null)
  .nullable()
  .optional();

export const contentAuthorFieldsSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(SITE_AUTHOR_ID, "Use lowercase letters, digits and dashes"),
  name: z.string().trim().min(1).max(CONTENT_AUTHOR_NAME_MAX_LENGTH),
  title: z
    .string()
    .trim()
    .max(CONTENT_AUTHOR_TITLE_MAX_LENGTH)
    .transform((value) => value || null)
    .nullable()
    .optional(),
  bio: z
    .string()
    .trim()
    .max(CONTENT_AUTHOR_BIO_MAX_LENGTH)
    .transform((value) => value || null)
    .nullable()
    .optional(),
  avatarUrl: mediaUrlSchema.nullable().optional(),
  url: optionalLinkSchema,
  x: optionalLinkSchema,
  linkedin: optionalLinkSchema,
  github: optionalLinkSchema,
});

export const contentAuthorSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  title: z.string().nullable(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  url: z.string().nullable(),
  x: z.string().nullable(),
  linkedin: z.string().nullable(),
  github: z.string().nullable(),
  userId: z.string().nullable(),
});

export type ContentAuthor = z.infer<typeof contentAuthorSchema>;
