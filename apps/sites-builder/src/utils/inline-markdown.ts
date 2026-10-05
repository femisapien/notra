/** Hrefs a banner link may use; anything else (javascript:, data:) renders as plain text. */
const SAFE_HREF = /^(?:https?:\/\/|\/(?!\/)|mailto:|#)/i;
const CODE = /`([^`\n]+)`/g;
// One level of balanced parentheses in the target, like Markdown (`/wiki/Foo_(bar)`).
const LINK = /\[([^\]\n]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g;
const STRONG = /\*\*(.+?)\*\*|__(.+?)__/g;
const EMPHASIS = /\*(.+?)\*|(?<!\w)_(.+?)_(?!\w)/g;
// A private-use character marks held pieces; it is stripped from the input first.
const PLACEHOLDER = /\uE000(\d+)\uE000/g;

export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Bold and italic on already escaped text; the markers can't produce markup of their own. */
function emphasis(escaped: string): string {
  return escaped
    .replace(
      STRONG,
      (_, a?: string, b?: string) => `<strong>${a ?? b}</strong>`
    )
    .replace(EMPHASIS, (_, a?: string, b?: string) => `<em>${a ?? b}</em>`);
}

/**
 * One line of Markdown (links, bold, italic, inline code) to HTML, for the
 * announcement banner. Deliberately not MDX: the line comes from notra.json,
 * so everything is escaped and only these few constructs become markup.
 */
export function renderInlineMarkdown(source: string): string {
  const pieces: string[] = [];
  const hold = (html: string) => {
    pieces.push(html);
    return `\uE000${pieces.length - 1}\uE000`;
  };
  // Code first so `*` inside it stays literal; links next so emphasis can wrap them.
  const withoutMarkers = source.replaceAll("\uE000", "");
  const withCode = withoutMarkers.replace(CODE, (_, code: string) =>
    hold(`<code>${escapeHtml(code)}</code>`)
  );
  const withLinks = withCode.replace(
    LINK,
    (_, label: string, target: string) => {
      const text = emphasis(escapeHtml(label));
      return hold(
        SAFE_HREF.test(target)
          ? `<a href="${escapeHtml(target)}">${text}</a>`
          : text
      );
    }
  );
  const html = emphasis(escapeHtml(withLinks));
  // Link labels may contain held code spans, so restore until none are left.
  let restored = html;
  while (restored.includes("\uE000")) {
    restored = restored.replace(
      PLACEHOLDER,
      (_, index: string) => pieces[Number(index)] ?? ""
    );
  }
  return restored;
}
