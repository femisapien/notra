"use client";

import { type RefObject, useEffect } from "react";

import { CHAT_ANNOTATION_HIGHLIGHT_NAME } from "@/constants/chat-annotations";

const WHITESPACE_REGEX = /\s+/g;
const PASSAGE_SEPARATOR = "\u0000";

/** Maps a whitespace-collapsed copy of `root`'s text back to DOM positions. */
function indexText(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const positions: { node: Text; offset: number }[] = [];
  let text = "";
  let lastWasSpace = true;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const value = node.textContent ?? "";
    for (let offset = 0; offset < value.length; offset += 1) {
      const isSpace = /\s/.test(value[offset] ?? "");
      if (isSpace && lastWasSpace) {
        continue;
      }
      text += isSpace ? " " : value[offset];
      positions.push({ node: node as Text, offset });
      lastWasSpace = isSpace;
    }
  }
  return { text, positions };
}

/**
 * Marks annotated passages inside `root` with the CSS Custom Highlight API,
 * so the rendered markdown is never touched. Passages that no longer appear
 * (the agent rewrote them) simply stop being marked.
 */
export function useAnnotationHighlights(
  rootRef: RefObject<HTMLElement | null>,
  passages: readonly string[],
  contentKey: string
) {
  // A string key keeps the effect from re-running on every new array.
  const passagesKey = passages.join(PASSAGE_SEPARATOR);

  useEffect(() => {
    const root = rootRef.current;
    const list = passagesKey ? passagesKey.split(PASSAGE_SEPARATOR) : [];
    if (!(root && "highlights" in CSS) || list.length === 0) {
      return;
    }
    const { text, positions } = indexText(root);
    const ranges: Range[] = [];
    for (const passage of list) {
      const needle = passage.replace(WHITESPACE_REGEX, " ").trim();
      const start = needle ? text.indexOf(needle) : -1;
      const first = positions[start];
      const last = positions[start + needle.length - 1];
      if (start === -1 || !first || !last) {
        continue;
      }
      const range = document.createRange();
      range.setStart(first.node, first.offset);
      range.setEnd(last.node, last.offset + 1);
      ranges.push(range);
    }
    const highlight = new Highlight(...ranges);
    CSS.highlights.set(CHAT_ANNOTATION_HIGHLIGHT_NAME, highlight);
    return () => {
      if (CSS.highlights.get(CHAT_ANNOTATION_HIGHLIGHT_NAME) === highlight) {
        CSS.highlights.delete(CHAT_ANNOTATION_HIGHLIGHT_NAME);
      }
    };
    // contentKey re-runs the search when the post body changes.
  }, [rootRef, passagesKey, contentKey]);
}
