import { expect, test } from "bun:test";

import { HorizontalRuleNode } from "@lexical/extension";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import {
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellNode,
  TableNode,
  TableRowNode,
} from "@lexical/table";
import { $getRoot, createEditor } from "lexical";

import { EDITOR_TRANSFORMERS } from "./markdown-transformers";
import { ContentImageNode } from "./nodes/content-image-node";
import { ContentVideoNode } from "./nodes/content-video-node";
import { KiboCodeBlockNode } from "./nodes/kibo-code-block-node";
import {
  $getTableMoveState,
  $moveTableColumn,
  $moveTableRow,
} from "./table-commands";

const SAMPLE_TABLE = `| A | B | C |
| --- | --- | --- |
| 1 | 2 | 3 |
| 4 | 5 | 6 |`;

function createTableEditor() {
  return createEditor({
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
      ContentVideoNode,
    ],
    onError: (error: Error) => {
      throw error;
    },
  });
}

function loadTable(markdown = SAMPLE_TABLE) {
  const editor = createTableEditor();
  editor.update(
    () => {
      $convertFromMarkdownString(markdown, EDITOR_TRANSFORMERS);
    },
    { discrete: true }
  );
  return editor;
}

function selectCell(
  editor: ReturnType<typeof createEditor>,
  row: number,
  column: number
) {
  editor.update(
    () => {
      const table = $getRoot().getChildren().find($isTableNode);
      const tableRow = table?.getChildAtIndex(row);
      if (!$isTableRowNode(tableRow)) {
        throw new Error("expected table row");
      }
      const cell = tableRow.getChildAtIndex(column);
      if (!$isTableCellNode(cell)) {
        throw new Error("expected table cell");
      }
      cell.getFirstChild()?.selectStart();
    },
    { discrete: true }
  );
}

function toMarkdown(editor: ReturnType<typeof createEditor>) {
  let markdown = "";
  editor.getEditorState().read(() => {
    markdown = $convertToMarkdownString(EDITOR_TRANSFORMERS);
  });
  return markdown;
}

test("move row down swaps the selected row with the next one", () => {
  const editor = loadTable();
  selectCell(editor, 1, 0);
  editor.update(
    () => {
      expect($moveTableRow("down")).toBe(true);
    },
    { discrete: true }
  );
  expect(toMarkdown(editor)).toContain("| 4 | 5 | 6 |");
  expect(toMarkdown(editor).indexOf("| 4 | 5 | 6 |")).toBeLessThan(
    toMarkdown(editor).indexOf("| 1 | 2 | 3 |")
  );
});

test("move column left swaps the selected column with the previous one", () => {
  const editor = loadTable();
  selectCell(editor, 0, 1);
  editor.update(
    () => {
      expect($moveTableColumn("left")).toBe(true);
    },
    { discrete: true }
  );
  const markdown = toMarkdown(editor);
  expect(markdown).toContain("| B | A | C |");
  expect(markdown).toContain("| 2 | 1 | 3 |");
});

test("edge moves are no-ops", () => {
  const editor = loadTable();
  selectCell(editor, 0, 0);
  editor.update(
    () => {
      const state = $getTableMoveState();
      expect(state?.canMoveUp).toBe(false);
      expect(state?.canMoveLeft).toBe(false);
      expect($moveTableRow("up")).toBe(false);
      expect($moveTableColumn("left")).toBe(false);
    },
    { discrete: true }
  );
  expect(toMarkdown(editor)).toContain("| A | B | C |");
});
