"use client";

import { GripVertical, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type StatusVariant } from "@/config/columns/shared";
import { cn } from "@/lib/utils";

/** Maps StatusVariant keys to concrete dot colors for the column header indicator. */
const VARIANT_COLORS: Record<StatusVariant, string> = {
  danger: "var(--color-red-500)",
  default: "var(--color-gray-500)",
  info: "var(--color-blue-500)",
  success: "var(--color-green-500)",
  warning: "var(--color-yellow-500)",
};

const VARIANT_KEYS = new Set<string>(Object.keys(VARIANT_COLORS));

/** Resolves a color value: if it's a StatusVariant key, returns the mapped hex color; otherwise returns the value as-is. */
function resolveColor(color: string): string {
  return VARIANT_KEYS.has(color) ? VARIANT_COLORS[color as StatusVariant] : color;
}

// Card and column ids share one DndContext id space. Cards are namespaced so a
// card id can never collide with a column id (e.g. an issue id == a status id).
const CARD_ID_PREFIX = "card:";
const toCardDragId = (id: string) => `${CARD_ID_PREFIX}${id}`;
const fromCardDragId = (dragId: string) =>
  dragId.startsWith(CARD_ID_PREFIX) ? dragId.slice(CARD_ID_PREFIX.length) : dragId;

/** Minimum shape required for items used in the Kanban board. */
export interface KanbanItemBase {
  id: string;
  /** Default grouping field. Override with the `groupBy` prop to categorize by another field. */
  status?: string;
}

/** Configuration for a single Kanban column. */
export interface KanbanColumnConfig {
  id: string;
  title: string;
  position: number;
  color?: StatusVariant | (string & {});
}

/** Payload emitted when a card is dropped into a new position. */
export interface KanbanDragEndEvent<T extends KanbanItemBase> {
  item: T;
  fromStatus: string;
  toStatus: string;
  fromIndex: number;
  toIndex: number;
}

interface KanbanProps<T extends KanbanItemBase> {
  items: T[];
  columns: KanbanColumnConfig[];
  /** Item field whose value matches a column id, used to group cards. Defaults to "status". */
  groupBy?: keyof T & string;
  renderCard: (item: T) => ReactNode;
  onDragEnd?: (event: KanbanDragEndEvent<T>) => void;
  onColumnsReorder?: (columns: KanbanColumnConfig[]) => void;
  onColumnEdit?: (columnId: string) => void;
  onColumnDelete?: (columnId: string) => void;
  columnEmptyState?: ReactNode;
  className?: string;
}

interface KanbanColumnProps<T extends KanbanItemBase> {
  config: KanbanColumnConfig;
  items: T[];
  renderCard: (item: T) => ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  columnEmptyState?: ReactNode;
  sortableId: string;
}

interface KanbanCardProps {
  id: string;
  children: ReactNode;
}

function KanbanCard({ id, children }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      data-slot="kanban-card"
      data-dragging={isDragging || undefined}
      style={style}
      className={cn(
        "cursor-grab rounded-xs border bg-white p-3 shadow-sm transition-shadow",
        "hover:shadow-md active:cursor-grabbing",
        "dark:border-neutral-700 dark:bg-neutral-800",
        isDragging && "ring-primary-200 dark:ring-primary-800 z-50 opacity-50 shadow-lg ring-2",
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

function KanbanColumn<T extends KanbanItemBase>({
  config,
  items,
  renderCard,
  onEdit,
  onDelete,
  columnEmptyState,
  sortableId,
}: KanbanColumnProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
    data: { type: "column", columnId: config.id },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: config.id });
  const hasActions = !!onEdit || !!onDelete;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setSortableRef}
      style={style}
      data-slot="kanban-column"
      data-status={config.id}
      className={cn("flex w-72 shrink-0 flex-col gap-y-2", isDragging && "z-50 opacity-50")}
    >
      <div
        data-slot="kanban-column-header"
        className={cn(
          "flex h-10 cursor-grab items-center justify-between rounded-xs px-3 active:cursor-grabbing",
          "bg-neutral-100 dark:bg-neutral-800",
        )}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-x-2">
          <GripVertical className="size-3.5 text-gray-400" />
          {config.color && (
            <span
              data-slot="kanban-status-indicator"
              className="size-2.5 rounded-full"
              style={{ backgroundColor: resolveColor(config.color) }}
            />
          )}
          <span className="text-sm font-semibold">{config.title}</span>
        </div>
        <div className="flex items-center gap-x-1">
          <span
            className={cn(
              "grid size-5 place-items-center rounded-full text-xs font-medium",
              "bg-neutral-200 dark:bg-neutral-700",
            )}
          >
            {items.length}
          </span>
          {hasActions && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  className="grid size-6 place-items-center rounded-xs text-gray-400 hover:bg-neutral-200 hover:text-gray-600 dark:hover:bg-neutral-700 dark:hover:text-gray-300"
                >
                  <MoreVertical className="size-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-36 p-1">
                <div className="flex flex-col">
                  {onEdit && (
                    <button
                      onClick={onEdit}
                      className="flex items-center gap-x-2 rounded-xs px-2.5 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-neutral-700"
                    >
                      <Pencil className="size-3.5 text-gray-500" />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={onDelete}
                      className="flex items-center gap-x-2 rounded-xs px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
      <div
        ref={setDroppableRef}
        data-slot="kanban-column-body"
        className={cn(
          "flex min-h-32 flex-col gap-y-2 rounded-xs p-1 transition-colors",
          isOver && "bg-primary-50/50 dark:bg-primary-950/30",
        )}
      >
        <SortableContext
          items={items.map((i) => toCardDragId(i.id))}
          strategy={verticalListSortingStrategy}
        >
          {items.length > 0
            ? items.map((item) => (
                <KanbanCard key={item.id} id={toCardDragId(item.id)}>
                  {renderCard(item)}
                </KanbanCard>
              ))
            : (columnEmptyState ?? (
                <div
                  data-slot="kanban-empty-state"
                  className={cn(
                    "grid min-h-24 place-items-center rounded-xs border border-dashed",
                    "border-neutral-300 dark:border-neutral-600",
                  )}
                >
                  <p className="text-sm text-neutral-400 dark:text-neutral-500">No items</p>
                </div>
              ))}
        </SortableContext>
      </div>
    </div>
  );
}

/**
 * Drag-and-drop Kanban board built on @dnd-kit.
 * Supports card dragging between columns, column reordering, and column actions.
 *
 * @template T - Item type extending KanbanItemBase
 *
 * Cards are grouped into columns by the `groupBy` field (defaults to "status"),
 * matching each item's field value against a column `id`.
 *
 * @example
 * ```tsx
 * <Kanban
 *   items={tasks}
 *   columns={[{ id: "todo", title: "To Do" }, { id: "done", title: "Done" }]}
 *   groupBy="status" // optional; default
 *   renderCard={(task) => <p>{task.title}</p>}
 *   onDragEnd={({ item, toStatus }) => updateTask(item.id, toStatus)}
 * />
 * ```
 */
export function Kanban<T extends KanbanItemBase>({
  items,
  columns,
  groupBy,
  renderCard,
  onDragEnd: onDragEndProp,
  onColumnsReorder,
  onColumnEdit,
  onColumnDelete,
  columnEmptyState,
  className,
}: KanbanProps<T>) {
  // Which item field maps to a column id. Falls back to "status".
  const groupKey = (groupBy ?? "status") as keyof T;
  const getGroup = useCallback((item: T) => String(item[groupKey] ?? ""), [groupKey]);

  const [activeItem, setActiveItem] = useState<T | null>(null);
  const [activeColumn, setActiveColumn] = useState<KanbanColumnConfig | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columnSortableIds = useMemo(() => columns.map((c) => `column-${c.id}`), [columns]);

  const itemsByStatus = useMemo(() => {
    const grouped: Record<string, T[]> = {};
    for (const col of columns) {
      grouped[col.id] = [];
    }
    for (const item of items) {
      const g = getGroup(item);
      if (grouped[g]) {
        grouped[g].push(item);
      }
    }
    return grouped;
  }, [items, columns, getGroup]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      if (active.data.current?.type === "column") {
        const col = columns.find((c) => c.id === active.data.current?.columnId);
        setActiveColumn(col ?? null);
      } else {
        const item = items.find((i) => i.id === fromCardDragId(active.id as string));
        setActiveItem(item ?? null);
      }
    },
    [items, columns],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveItem(null);
      setActiveColumn(null);

      const { active, over } = event;
      if (!over) return;

      // Column reorder
      if (active.data.current?.type === "column") {
        if (!onColumnsReorder) return;
        const activeColId = active.data.current.columnId as string;

        let targetColId: string | undefined;
        if (over.data.current?.type === "column") {
          targetColId = over.data.current.columnId as string;
        } else if (columns.some((c) => c.id === over.id)) {
          targetColId = over.id as string;
        } else {
          const overItem = items.find((i) => i.id === fromCardDragId(over.id as string));
          targetColId = overItem ? getGroup(overItem) : undefined;
        }

        if (!targetColId || activeColId === targetColId) return;
        const oldIndex = columns.findIndex((c) => c.id === activeColId);
        const newIndex = columns.findIndex((c) => c.id === targetColId);
        if (oldIndex !== -1 && newIndex !== -1) {
          onColumnsReorder(arrayMove(columns, oldIndex, newIndex));
        }
        return;
      }

      // Card drag
      if (!onDragEndProp) return;

      const activeId = fromCardDragId(active.id as string);
      const overId = over.id as string;

      const draggedItem = items.find((item) => item.id === activeId);
      if (!draggedItem) return;

      const fromStatus = getGroup(draggedItem);

      let toStatus: string;
      let toIndex: number;

      // A column droppable keeps its raw id; a card target is namespaced.
      const isOverColumn = columns.some((col) => col.id === overId);
      if (isOverColumn) {
        toStatus = overId;
        toIndex = itemsByStatus[overId]?.length ?? 0;
      } else {
        const overItemId = fromCardDragId(overId);
        const overItem = items.find((item) => item.id === overItemId);
        if (!overItem) return;
        toStatus = getGroup(overItem);
        toIndex = (itemsByStatus[toStatus] ?? []).findIndex((i) => i.id === overItemId);
      }

      const fromIndex = (itemsByStatus[fromStatus] ?? []).findIndex((i) => i.id === activeId);

      if (fromStatus === toStatus && fromIndex === toIndex) return;

      onDragEndProp({ item: draggedItem, fromStatus, toStatus, fromIndex, toIndex });
    },
    [items, columns, itemsByStatus, onDragEndProp, onColumnsReorder, getGroup],
  );

  const sorted = columns.sort((a, b) => a.position - b.position);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div data-slot="kanban" className={cn("w-full overflow-hidden", className)}>
        <div className="flex w-auto items-start gap-x-2 overflow-x-auto p-1">
          <SortableContext items={columnSortableIds} strategy={horizontalListSortingStrategy}>
            {sorted.map((column) => (
              <KanbanColumn
                key={column.id}
                config={column}
                sortableId={`column-${column.id}`}
                items={itemsByStatus[column.id] ?? []}
                renderCard={renderCard}
                onEdit={onColumnEdit ? () => onColumnEdit(column.id) : undefined}
                onDelete={onColumnDelete ? () => onColumnDelete(column.id) : undefined}
                columnEmptyState={columnEmptyState}
              />
            ))}
          </SortableContext>
        </div>
      </div>
      <DragOverlay>
        {activeColumn ? (
          <div data-slot="kanban-column-overlay" className="flex w-72 flex-col gap-y-2">
            <div
              className={cn(
                "flex h-10 items-center gap-x-2 rounded-xs px-3 shadow-lg",
                "bg-neutral-100 dark:bg-neutral-800",
              )}
            >
              <GripVertical className="size-3.5 text-gray-400" />
              {activeColumn.color && (
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: resolveColor(activeColumn.color) }}
                />
              )}
              <span className="text-sm font-semibold">{activeColumn.title}</span>
              <span
                className={cn(
                  "ml-auto grid size-5 place-items-center rounded-full text-xs font-medium",
                  "bg-neutral-200 dark:bg-neutral-700",
                )}
              >
                {itemsByStatus[activeColumn.id]?.length ?? 0}
              </span>
            </div>
            <div
              className={cn(
                "min-h-24 rounded-xs border border-dashed",
                "border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900",
              )}
            />
          </div>
        ) : activeItem ? (
          <div
            data-slot="kanban-card-overlay"
            className="rounded-xs border bg-white p-3 shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
          >
            {renderCard(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
