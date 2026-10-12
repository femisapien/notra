import { postCoverImageSchema } from "@notra/ai/schemas/post-metadata";
import type { ContentResponse } from "@notra/schemas/dashboard/content";
import type { PostMetadataPatch } from "@notra/schemas/shared/post-metadata";

import { MARKDOWN_IMAGE_URLS } from "@/constants/content-overview";

/** The post's metadata with a patch applied, for optimistic updates. */
export function applyMetadataPatch(
  metadata: ContentResponse["metadata"],
  patch: PostMetadataPatch
): ContentResponse["metadata"] {
  return {
    coverImage:
      patch.coverImage === undefined ? metadata.coverImage : patch.coverImage,
    tags: patch.tags ?? metadata.tags,
    excerpt:
      patch.excerpt === undefined ? metadata.excerpt : patch.excerpt || null,
    authorIds: patch.authorIds ?? metadata.authorIds,
    featured: patch.featured ?? metadata.featured,
    noindex: patch.noindex ?? metadata.noindex,
    displayDate:
      patch.displayDate === undefined
        ? metadata.displayDate
        : patch.displayDate,
  };
}

/** Images in the post that could serve as its cover, without duplicates. */
export function coverCandidatesInMarkdown(markdown: string): string[] {
  const urls = [...markdown.matchAll(MARKDOWN_IMAGE_URLS)]
    .map((match) => match[1])
    .filter((url): url is string => Boolean(url))
    .filter((url) => postCoverImageSchema.shape.url.safeParse(url).success);
  return [...new Set(urls)];
}

/** A YYYY-MM-DD day as a local date, so the calendar shows the same day. */
export function displayDateToLocalDate(value: string): Date {
  const [year = 1970, month = 1, day = 1] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** The picked calendar day as YYYY-MM-DD, without a timezone shift. */
export function localDateToDisplayDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
