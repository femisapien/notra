import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getTableCellNodeFromLexicalNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  type TableCellNode,
  type TableNode,
  type TableRowNode,
} from "@lexical/table";
import { $getSelection, $isRangeSelection } from "lexical";

interface TableSelectionContext {
  columnIndex: number;
  row: TableRowNode;
  rowIndex: number;
  rows: TableRowNode[];
  table: TableNode;
}

export interface TableMoveState {
  canDeleteColumn: boolean;
  canDeleteRow: boolean;
  canMoveDown: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  canMoveUp: boolean;
}

function $getTableSelectionContext(): TableSelectionContext | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return null;
  }

  const cell = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
  if (!cell) {
    return null;
  }

  const row = cell.getParent();
  if (!$isTableRowNode(row)) {
    return null;
  }

  const table = row.getParent();
  if (!$isTableNode(table)) {
    return null;
  }

  const rows = table.getChildren().filter($isTableRowNode);
  const rowIndex = rows.indexOf(row);
  const cells = row.getChildren().filter($isTableCellNode);
  const columnIndex = cells.indexOf(cell);

  if (rowIndex < 0 || columnIndex < 0) {
    return null;
  }

  return { columnIndex, row, rowIndex, rows, table };
}

export function $getTableMoveState(): TableMoveState | null {
  const context = $getTableSelectionContext();
  if (!context) {
    return null;
  }

  const columnCount = context.rows[0]?.getChildrenSize() ?? 0;

  return {
    canDeleteColumn: columnCount > 1,
    canDeleteRow: context.rows.length > 1,
    canMoveDown: context.rowIndex < context.rows.length - 1,
    canMoveLeft: context.columnIndex > 0,
    canMoveRight: context.columnIndex < columnCount - 1,
    canMoveUp: context.rowIndex > 0,
  };
}

export function $moveTableRow(direction: "down" | "up"): boolean {
  const context = $getTableSelectionContext();
  if (!context) {
    return false;
  }

  const sibling =
    direction === "up"
      ? context.row.getPreviousSibling()
      : context.row.getNextSibling();
  if (!sibling || !$isTableRowNode(sibling)) {
    return false;
  }

  if (direction === "up") {
    sibling.insertBefore(context.row);
  } else {
    sibling.insertAfter(context.row);
  }

  return true;
}

export function $moveTableColumn(direction: "left" | "right"): boolean {
  const context = $getTableSelectionContext();
  if (!context) {
    return false;
  }

  const targetIndex =
    direction === "left" ? context.columnIndex - 1 : context.columnIndex + 1;
  if (targetIndex < 0) {
    return false;
  }

  const moves: Array<{ current: TableCellNode; target: TableCellNode }> = [];

  for (const row of context.rows) {
    const cells = row.getChildren().filter($isTableCellNode);
    const current = cells[context.columnIndex];
    const target = cells[targetIndex];
    if (!current || !target) {
      return false;
    }
    moves.push({ current, target });
  }

  for (const { current, target } of moves) {
    if (direction === "left") {
      target.insertBefore(current);
    } else {
      target.insertAfter(current);
    }
  }

  return true;
}

export function $deleteSelectedTableRow(): void {
  const state = $getTableMoveState();
  if (!state?.canDeleteRow) {
    $deleteSelectedTable();
    return;
  }
  $deleteTableRowAtSelection();
}

export function $deleteSelectedTableColumn(): void {
  const state = $getTableMoveState();
  if (!state?.canDeleteColumn) {
    $deleteSelectedTable();
    return;
  }
  $deleteTableColumnAtSelection();
}

export function $deleteSelectedTable(): boolean {
  const context = $getTableSelectionContext();
  if (!context) {
    return false;
  }
  context.table.remove();
  return true;
}
