"use client";

/**
 * Vendored from Kibo UI.
 * Upstream: https://raw.githubusercontent.com/haydenbleasel/kibo/main/packages/kanban/index.tsx
 *
 * Divergences from upstream (keep in sync when re-syncing):
 *
 * Structural / cosmetic
 *  1. Imports resolve through `@notra/ui/*` instead of the upstream `@/*` alias.
 *  2. `KanbanItemProps`, `KanbanColumnProps` and `KanbanContextProps` are exported.
 *  3. `ScrollArea`/`ScrollBar` around `KanbanCards` removed: columns run flush and
 *     the whole board scrolls horizontally in the consumer instead.
 *  4. Grab/grabbing cursors live on the sortable wrapper (the card inherits them)
 *     rather than on the `Card` itself.
 *  5. `CSS.Translate.toString` instead of `CSS.Transform.toString` so cards are not
 *     scaled while dragging.
 *  6. `DragOverlay` uses `dropAnimation={null}` (the overlay is a portal clone, the
 *     upstream drop animation flashes against the re-rendered board).
 *  7. Context value is memoized and `activeCardId` lives in its own context so cards
 *     do not re-render for every board data change.
 *
 * Behaviour
 *  8. Immutable updates + index guards: upstream mutates `data[activeIndex].column`
 *     in place and calls `arrayMove` with `-1` indexes when the drop target is a
 *     column rather than a card.
 *  9. No `arrayMove` anywhere. A drop only changes column membership; ordering stays
 *     owned by whatever feeds `data`, so it cannot drift from the source of truth.
 * 10. `dropDisabledColumnIds`: listed columns render as a rejected drop target,
 *     never receive a card on drag over or drag end (cards can still be dragged
 *     *out* of them).
 * 11. `data` is snapshotted on drag start and restored in a provider level
 *     `handleDragCancel`, so `Escape` reverts cross-column drag-over moves.
 * 12. `onDragEnd` receives a `KanbanDragEndEvent` carrying the resolved, validated
 *     `targetColumnId` (null when the drop was rejected and reverted), so consumers
 *     never have to diff state to find out what happened.
 * 13. Upstream's `columns[0]?.id` fallback for an unresolvable drop target is gone:
 *     an unknown target is a rejected drop, not a drop into the first column.
 * 14. `KanbanCard` gained `disabled` (locks dragging while a row mutation is in
 *     flight) and `onActivate` (click / Enter opens the card). The wrapper is the
 *     single interactive element, so nothing nests inside dnd-kit's `role="button"`.
 * 15. `touch-none` removed from the card wrapper (upstream has none either) in
 *     favour of `touch-manipulation`; the touch sensor uses a delay + tolerance
 *     so touch scrolling still wins.
 * 16. Sensors: activation constraints, `sortableKeyboardCoordinates`, and keyboard
 *     codes that reserve `Enter` for activation and leave `Space` to lift a card.
 * 17. Announcements resolve `over.id` against both cards and columns, speak the
 *     column *name*, and announce rejected drop targets.
 * 18. Cards are never droppables and collision detection is column based
 *     (`pointerWithin`, then `rectIntersection`, then `closestCenter`), so a drop
 *     lands in the column under the pointer even when it is tall or empty.
 */

import type {
  DndContextProps,
  DragCancelEvent,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import tunnel from "tunnel-rat";


const t = tunnel();



const EMPTY_DROP_DISABLED_COLUMN_IDS: ReadonlySet<string> = new Set<string>();


export type { DragEndEvent } from "@dnd-kit/core";

export type KanbanItemProps = {
  id: string;
  name: string;
  column: string;
} & Record<string, unknown>;

export type KanbanColumnProps = {
  id: string;
  name: string;
} & Record<string, unknown>;

/** A drag end event enriched with the destination the provider actually accepted. */
export type KanbanDragEndEvent = DragEndEvent & {
  /** Resolved destination column, or `null` when the drop was rejected and reverted. */
  targetColumnId: string | null;
};

export type KanbanContextProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = {
  columns: C[];
  data: T[];
  dropDisabledColumnIds: ReadonlySet<string>;
};

const KanbanContext = createContext<KanbanContextProps>({
  columns: [],
  data: [],
  dropDisabledColumnIds: EMPTY_DROP_DISABLED_COLUMN_IDS,
});

const KanbanActiveCardContext = createContext<string | null>(null);

export type KanbanBoardProps = {
  id: string;
  children: ReactNode;
  className?: string;
};


export type KanbanCardProps<T extends KanbanItemProps = KanbanItemProps> = T & {
  children?: ReactNode;
  className?: string;
  /** Locks dragging, e.g. while the row this card represents is being saved. */
  disabled?: boolean;
  /** Called on click or `Enter` when the card is not being dragged. */
  onActivate?: () => void;
};


export type KanbanCardsProps<T extends KanbanItemProps = KanbanItemProps> =
  Omit<HTMLAttributes<HTMLDivElement>, "children" | "id"> & {
    children: (item: T) => ReactNode;
    id: string;
  };




export type KanbanProviderProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = Omit<
  DndContextProps,
  "children" | "onDragCancel" | "onDragEnd" | "onDragOver" | "onDragStart"
> & {
  children: (column: C) => ReactNode;
  className?: string;
  columns: C[];
  data: T[];
  /** Columns that render as targets but never accept a card. */
  dropDisabledColumnIds?: readonly string[];
  onDataChange?: (data: T[]) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: KanbanDragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragCancel?: (event: DragCancelEvent) => void;
};
