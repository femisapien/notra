import { expect, test } from "bun:test";

import { HorizontalRuleNode } from "@lexical/extension";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { createEditor } from "lexical";

import { EDITOR_TRANSFORMERS } from "./markdown-transformers";
import { ContentImageNode } from "./nodes/content-image-node";
import { KiboCodeBlockNode } from "./nodes/kibo-code-block-node";

function withMarkdown(markdown: string) {
  const editor = createEditor({
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      KiboCodeBlockNode,
      LinkNode,
      AutoLinkNode,
      HorizontalRuleNode,
      TableNode,
      TableRowNode,
      TableCellNode,
      ContentImageNode,
    ],
    onError: (error: Error) => {
      throw error;
    },
  });
  editor.update(
    () => {
      $convertFromMarkdownString(markdown, EDITOR_TRANSFORMERS);
    },
    { discrete: true }
  );
  let next = "";
  editor.getEditorState().read(() => {
    next = $convertToMarkdownString(EDITOR_TRANSFORMERS);
  });
  return next;
}

test("image markdown round-trips through the editor", () => {
  const markdown = withMarkdown("![Cover photo](https://cdn.example/a.png)");
  expect(markdown).toContain("![Cover photo](https://cdn.example/a.png)");
});

test("unsafe image urls stay as text", () => {
  const editor = createEditor({
    nodes: [ContentImageNode],
    onError: (error: Error) => {
      throw error;
    },
  });
  const unsafeUrl = ["java", "script:alert(1)"].join("");
  editor.update(
    () => {
      $convertFromMarkdownString(`![x](${unsafeUrl})`, EDITOR_TRANSFORMERS);
    },
    { discrete: true }
  );
  const serialized = JSON.stringify(editor.getEditorState().toJSON());
  expect(serialized).not.toContain('"content-image"');
  expect(serialized).toContain("alert(1)");
});
