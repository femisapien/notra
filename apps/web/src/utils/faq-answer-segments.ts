import { FAQ_ASSISTANT_LINK_HOSTS } from "@/constants/landing/faq-assistant";
import type { FaqAnswerSegment } from "@/types/landing/faq-assistant";

const URL_PATTERN = /https:\/\/[^\s<>"')\]]+/g;
const TRAILING_PUNCTUATION = /[.,;:!?]+$/;

const allowedHosts: ReadonlySet<string> = new Set(FAQ_ASSISTANT_LINK_HOSTS);

function isAllowedUrl(candidate: string): boolean {
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" && allowedHosts.has(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Model output is rendered as text. Only https URLs on our own hosts become
 * links, so an answer can never point a visitor somewhere we don't control.
 */
export function splitFaqAnswer(text: string): FaqAnswerSegment[] {
  const segments: FaqAnswerSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const href = match[0].replace(TRAILING_PUNCTUATION, "");

    if (!isAllowedUrl(href)) {
      continue;
    }

    if (match.index > cursor) {
      segments.push({ type: "text", value: text.slice(cursor, match.index) });
    }
    segments.push({ type: "link", value: href, href });
    cursor = match.index + href.length;
  }

  if (cursor < text.length) {
    segments.push({ type: "text", value: text.slice(cursor) });
  }

  return segments;
}
