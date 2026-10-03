import type { SiteDetail, SiteSection } from "@/types/sites";

/** The count a site section shows in the sidebar: previews, domains or drafts; 0 hides it. */
export function siteSectionCount(
  section: SiteSection,
  detail: SiteDetail | undefined
): number {
  if (!detail) {
    return 0;
  }
  if (section === "previews") {
    return detail.previews.length;
  }
  if (section === "domains") {
    return detail.domains.length;
  }
  return section === "editor" ? detail.draftCount : 0;
}
