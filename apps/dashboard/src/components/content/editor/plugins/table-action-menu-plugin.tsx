"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getTableCellNodeFromLexicalNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
} from "@lexical/table";
import { mergeRegister } from "@lexical/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { cn } from "@notra/ui/lib/utils";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  BetweenVerticalEnd,
  BetweenVerticalStart,
  Columns3,
  Plus,
  Rows3,
  Trash2,
} from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  $deleteSelectedTable,
  $deleteSelectedTableColumn,
  $deleteSelectedTableRow,
  $getTableMoveState,
  $moveTableColumn,
  $moveTableRow,
  type TableMoveState,
} from "../table-commands";

interface TableActionMenuProps {
  editor: ReturnType<typeof useLexicalComposerContext>[0];
  anchorElem: HTMLElement;
  cellDOMNode: HTMLElement;
  onInsertMenuOpenChange: (open: boolean) => void;
}

const IDLE_MOVE_STATE: TableMoveState = {
  canDeleteColumn: false,
  canDeleteRow: false,
  canMoveDown: false,
  canMoveLeft: false,
  canMoveRight: false,
  canMoveUp: false,
};

const toolbarButtonClass =
  "rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

function TableToolbarButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={label}
      className={cn(toolbarButtonClass, className)}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function TableActionMenu({
  editor,
  anchorElem,
  cellDOMNode,
  onInsertMenuOpenChange,
}: TableActionMenuProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [moveState, setMoveState] = useState<TableMoveState>(IDLE_MOVE_STATE);

  const updatePosition = useCallback(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) {
      return;
    }

    const cellRect = cellDOMNode.getBoundingClientRect();
    const anchorRect = anchorElem.getBoundingClientRect();
    const toolbarHeight = toolbar.offsetHeight;
    const spaceAbove = cellRect.top - anchorRect.top;
    const minSpaceNeeded = toolbarHeight + 8;

    const top =
      spaceAbove < minSpaceNeeded
        ? cellRect.bottom - anchorRect.top + 4
        : cellRect.top - anchorRect.top - toolbarHeight - 4;

    let left =
      cellRect.left -
      anchorRect.left +
      cellRect.width / 2 -
      toolbar.offsetWidth / 2;

    const maxLeft = anchorRect.width - toolbar.offsetWidth;
    left = Math.max(0, Math.min(left, maxLeft));

    toolbar.style.top = `${top}px`;
    toolbar.style.left = `${left}px`;
    toolbar.style.opacity = "1";
  }, [anchorElem, cellDOMNode]);

  const syncMoveState = useCallback(() => {
    editor.getEditorState().read(() => {
      setMoveState($getTableMoveState() ?? IDLE_MOVE_STATE);
    });
  }, [editor]);

  useEffect(() => {
    updatePosition();
    syncMoveState();
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
    };
  }, [syncMoveState, updatePosition]);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        updatePosition();
        setMoveState($getTableMoveState() ?? IDLE_MOVE_STATE);
      });
    });
  }, [editor, updatePosition]);

  const run = useCallback(
    (action: () => void) => {
      editor.update(() => {
        action();
      });
    },
    [editor]
  );

  return (
    <div
      className="bg-popover absolute z-50 flex items-center gap-0.5 rounded-lg border p-1 opacity-0 shadow-lg transition-opacity"
      onMouseDown={(event) => event.preventDefault()}
      ref={toolbarRef}
      role="toolbar"
      style={{ pointerEvents: "auto" }}
    >
      <TableToolbarButton
        disabled={!moveState.canMoveUp}
        label="Move row up"
        onClick={() => run(() => $moveTableRow("up"))}
      >
        <ArrowUp className="size-4" />
      </TableToolbarButton>
      <TableToolbarButton
        disabled={!moveState.canMoveDown}
        label="Move row down"
        onClick={() => run(() => $moveTableRow("down"))}
      >
        <ArrowDown className="size-4" />
      </TableToolbarButton>
      <TableToolbarButton
        disabled={!moveState.canMoveLeft}
        label="Move column left"
        onClick={() => run(() => $moveTableColumn("left"))}
      >
        <ArrowLeft className="size-4" />
      </TableToolbarButton>
      <TableToolbarButton
        disabled={!moveState.canMoveRight}
        label="Move column right"
        onClick={() => run(() => $moveTableColumn("right"))}
      >
        <ArrowRight className="size-4" />
      </TableToolbarButton>
      <div className="bg-border mx-0.5 h-4 w-px" />
      <DropdownMenu modal={false} onOpenChange={onInsertMenuOpenChange}>
        <DropdownMenuTrigger
          render={
            <button
              aria-label="Insert or delete rows and columns"
              className={cn(toolbarButtonClass, "inline-flex items-center")}
              title="Insert or delete rows and columns"
              type="button"
            />
          }
        >
          <Plus className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-auto min-w-44">
          <DropdownMenuItem
            onClick={() => run(() => $insertTableRowAtSelection(false))}
          >
            <BetweenHorizontalStart className="size-4" />
            Insert row above
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => run(() => $insertTableRowAtSelection(true))}
          >
            <BetweenHorizontalEnd className="size-4" />
            Insert row below
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => run(() => $insertTableColumnAtSelection(false))}
          >
            <BetweenVerticalStart className="size-4" />
            Insert column left
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => run(() => $insertTableColumnAtSelection(true))}
          >
            <BetweenVerticalEnd className="size-4" />
            Insert column right
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!moveState.canDeleteRow}
            onClick={() => run(() => $deleteSelectedTableRow())}
            variant="destructive"
          >
            <Rows3 className="size-4" />
            Delete row
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!moveState.canDeleteColumn}
            onClick={() => run(() => $deleteSelectedTableColumn())}
            variant="destructive"
          >
            <Columns3 className="size-4" />
            Delete column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <TableToolbarButton
        className="hover:bg-destructive/10 hover:text-destructive"
        label="Delete table"
        onClick={() => run(() => $deleteSelectedTable())}
      >
        <Trash2 className="size-4" />
      </TableToolbarButton>
    </div>
  );
}

interface TableActionMenuPluginProps {
  anchorElem: HTMLElement;
}

export function TableActionMenuPlugin({
  anchorElem,
}: TableActionMenuPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [tableCellDOMNode, setTableCellDOMNode] = useState<HTMLElement | null>(
    null
  );
  const insertMenuOpenRef = useRef(false);

  const updateMenu = useCallback(() => {
    editor.getEditorState().read(() => {
      if (editor.isComposing()) {
        return;
      }

      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        if (!insertMenuOpenRef.current) {
          setTableCellDOMNode(null);
        }
        return;
      }

      const anchor = selection.anchor.getNode();
      const cellNode = $getTableCellNodeFromLexicalNode(anchor);
      if (!cellNode) {
        if (!insertMenuOpenRef.current) {
          setTableCellDOMNode(null);
        }
        return;
      }

      const cellDOMNode = editor.getElementByKey(cellNode.getKey());
      if (!cellDOMNode) {
        if (!insertMenuOpenRef.current) {
          setTableCellDOMNode(null);
        }
        return;
      }
      setTableCellDOMNode(cellDOMNode);
    });
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updateMenu();
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateMenu();
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, updateMenu]);

  if (!tableCellDOMNode) {
    return null;
  }

  return createPortal(
    <TableActionMenu
      anchorElem={anchorElem}
      cellDOMNode={tableCellDOMNode}
      editor={editor}
      onInsertMenuOpenChange={(open) => {
        insertMenuOpenRef.current = open;
        if (!open) {
          updateMenu();
        }
      }}
    />,
    anchorElem
  );
}
