import { findBrandMention } from "@notra/geo-core/utils/geo-brand-mention";
import { getReferenceDomain } from "@notra/geo-core/utils/reference-display";

import type { OfferingCitationShare, OfferingSource } from "@/types/offering";

const SHARE_SCALE = 100;

const UNKNOWN_ANSWER_PATTERN =
  /\b(could(?:n['’]t| not) find|no (?:public )?(?:information|results)|unable to find|i don['’]t (?:have|know)|not (?:able to )?find)\b/i;

const BRAND_SLUG_PATTERN = /[^a-z0-9]+/g;

export function offeringIsKnown(input: {
  answer: string;
  brand: string;
  feature: string | null;
}): boolean {
  return offeringMatchedTerm(input) !== null;
}

export function offeringMatchedTerm(input: {
  answer: string;
  brand: string;
  feature: string | null;
}): string | null {
  if (input.feature) {
    return findBrandMention(input.answer, input.feature, []);
  }
  const mentioned = findBrandMention(input.answer, input.brand, []);
  if (!mentioned) {
    return null;
  }
  if (UNKNOWN_ANSWER_PATTERN.test(input.answer)) {
    return null;
  }
  return mentioned;
}

export function citationShareFor(
  sources: readonly OfferingSource[],
  brand: string
): OfferingCitationShare[] {
  const byDomain = new Map<string, OfferingCitationShare>();
  for (const source of sources) {
    const existing = byDomain.get(source.domain);
    if (existing) {
      existing.count += 1;
      continue;
    }
    byDomain.set(source.domain, {
      domain: source.domain,
      count: 1,
      share: 0,
      title: source.title,
      url: source.url,
      isBrand: domainLooksLikeBrand(source.domain, brand),
    });
  }
  const total = sources.length;
  return [...byDomain.values()]
    .map((row) => ({
      ...row,
      share: total === 0 ? 0 : Math.round((row.count / total) * SHARE_SCALE),
    }))
    .toSorted(
      (left, right) =>
        right.count - left.count || left.domain.localeCompare(right.domain)
    );
}

export function offeringSourcesFrom(
  entries: readonly { url: string; title?: string | null }[]
): OfferingSource[] {
  const seen = new Set<string>();
  const sources: OfferingSource[] = [];
  for (const entry of entries) {
    const url = entry.url.trim();
    const domain = getReferenceDomain(url);
    if (!domain || seen.has(url)) {
      continue;
    }
    seen.add(url);
    sources.push({
      url,
      domain,
      title:
        typeof entry.title === "string" && entry.title.trim().length > 0
          ? entry.title.trim()
          : domain,
    });
  }
  return sources;
}

export function domainLooksLikeBrand(domain: string, brand: string): boolean {
  const slug = brand.toLowerCase().replace(BRAND_SLUG_PATTERN, "");
  if (slug.length < 3) {
    return false;
  }
  return domain.toLowerCase().replace(BRAND_SLUG_PATTERN, "").includes(slug);
}
