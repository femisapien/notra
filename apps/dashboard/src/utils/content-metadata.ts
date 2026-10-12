import type { ContentResponse } from "@notra/schemas/dashboard/content";
import {
  type PostMetadataPatch,
  postCoverImageSchema,
} from "@notra/schemas/shared/post-metadata";

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
