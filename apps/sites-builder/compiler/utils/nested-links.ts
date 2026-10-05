/**
 * Opening and closing `<a>` tags, plus the spans whose text is not markup
 * (comments, scripts, styles, textareas) so an `<a` inside them is skipped.
 */
const LINK_TOKEN =
  /<!--[\s\S]*?-->|<(script|style|textarea)\b[\s\S]*?<\/\1\s*>|<a\b[^>]*>|<\/a\s*>/gi;

/**
 * Unwraps links inside links. GFM turns a bare URL or email into a link even
 * inside an `<a>` the author wrote (`<a href="mailto:x">{{ supportEmail }}</a>`),
 * and browsers then split the invalid nesting into two links. The inner link
 * keeps its text and loses its tags.
 */
export function unnestLinks(html: string): string {
  if (!html.includes("<a")) {
    return html;
  }
  const dropped: boolean[] = [];
  return html.replace(LINK_TOKEN, (token, rawText: string | undefined) => {
    if (rawText !== undefined || token.startsWith("<!--")) {
      return token;
    }
    if (token[1] === "/") {
      return dropped.pop() ? "" : token;
    }
    const inner = dropped.length > 0;
    dropped.push(inner);
    return inner ? "" : token;
  });
}
