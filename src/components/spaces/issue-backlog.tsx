"use client";

import { ChevronDown, ChevronRight, GripVertical, Loader2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { useSprints, useUpdateSprint } from "@/hooks/use-sprints";
import { IssueFunctions } from "./issue-functions";
import { type Issue, type Sprint } from "@/types";
import { getApiErrorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { useIssues, useUpdateIssue } from "@/hooks/use-issues";
import { useMembers } from "@/hooks/use-orgs";
import { CreateSprintDialog } from "./create-sprint-dialog";
import { EditSprintDialog } from "./edit-sprint-dialog";
import { BacklogRow } from "./backlog-row";
import { rankBetween } from "@/lib/rank";
import { cn } from "@/lib/utils";

// Drop targets are keyed by group: a sprint id, or BACKLOG for the backlog.
const BACKLOG = "backlog";
const groupOf = (i: Issue) => i.sprint_id ?? BACKLOG;

// Draggable issue ids are namespaced so they can't collide with a group's
// droppable id (a sprint id) in the shared DndContext id space.
const ISSUE_PREFIX = "issue:";
const toIssueDragId = (id: string) => `${ISSUE_PREFIX}${id}`;
const fromIssueDragId = (dragId: string) =>
  dragId.startsWith(ISSUE_PREFIX) ? dragId.slice(ISSUE_PREFIX.length) : dragId;

function dateRange(s: Sprint): string {
  if (s.start_date && s.end_date) {
    return `${format(new Date(s.start_date), "d MMM")} - ${format(new Date(s.end_date), "d MMM")}`;
  }
  return "no dates set";
}

/** An issue row with a dedicated drag handle (so the row's links/selects stay clickable). */
function SortableIssueRow({ issue, slug }: { issue: Issue; slug: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: toIssueDragId(issue.id),
  });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex items-stretch", isDragging && "opacity-50")}
    >
      <button
        type="button"
        aria-label="Drag issue"
        className="text-muted-foreground hover:bg-muted/40 flex cursor-grab items-center border-t px-1 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <BacklogRow issue={issue} slug={slug} />
      </div>
    </div>
  );
}

interface SectionProps {
  title: React.ReactNode;
  subtitle?: string;
  count: number;
  issues: Issue[];
  slug: string;
  droppableId: string;
  action?: React.ReactNode;
  defaultOpen?: boolean;
  emptyHint?: string;
}

function Section({
  title,
  subtitle,
  count,
  issues,
  slug,
  droppableId,
  action,
  defaultOpen = true,
  emptyHint,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const Chevron = open ? ChevronDown : ChevronRight;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <motion.section className="overflow-hidden rounded-xs border">
      <div className="bg-muted/40 flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Chevron className="size-4" />
        </button>
        <div className="flex flex-1 items-baseline gap-2">
          <span className="font-medium">{title}</span>
          {subtitle && <span className="text-muted-foreground text-xs">{subtitle}</span>}
          <span className="text-muted-foreground text-xs">({count} work items)</span>
        </div>
        {action}
      </div>
      {open && (
        <div ref={setNodeRef} className={cn(isOver && "bg-primary-50/50")}>
          <SortableContext
            items={issues.map((i) => toIssueDragId(i.id))}
            strategy={verticalListSortingStrategy}
          >
            {issues.length > 0 ? (
              issues.map((i) => <SortableIssueRow key={i.id} issue={i} slug={slug} />)
            ) : (
              <div className="text-muted-foreground border-t border-dashed px-3 py-6 text-center text-sm">
                {emptyHint ?? "No work items."}
              </div>
            )}
          </SortableContext>
        </div>
      )}
    </motion.section>
  );
}

export function IssueBacklog({ slug, spaceKey }: { slug: string; spaceKey: string }) {
  const sprints = useSprints(slug, spaceKey);
  const issues = useIssues(slug, { space: spaceKey });
  const updateSprint = useUpdateSprint(slug, spaceKey);
  const updateIssue = useUpdateIssue(slug);
  const [query] = useState("");
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const members = useMembers(slug);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const q = query.trim().toLowerCase();
  const matches = (i: Issue) =>
    !q || i.title.toLowerCase().includes(q) || i.key.toLowerCase().includes(q);
  const all = (issues.data ?? []).filter(matches).sort((a, b) => a.rank - b.rank);
  const openSprints = (sprints.data ?? []).filter((s) => s.status !== "completed");
  const backlog = all.filter((i) => !i.sprint_id);

  // Valid drop-group ids: the backlog plus every open sprint.
  const groupIds = useMemo(
    () => new Set<string>([BACKLOG, ...openSprints.map((s) => s.id)]),
    [openSprints],
  );

  const defaultSprintName = `${spaceKey} Sprint ${(sprints.data?.length ?? 0) + 1}`;

  const transition = (s: Sprint, status: "active" | "completed", label: string) =>
    updateSprint.mutate(
      { id: s.id, update: { status } },
      {
        onSuccess: () => toast.success(`${label} ${s.name}`),
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );

  const handleDragStart = (e: DragStartEvent) => {
    const issue = all.find((i) => i.id === fromIssueDragId(String(e.active.id)));
    setActiveIssue(issue ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveIssue(null);
    const { active, over } = e;
    if (!over) return;

    const issue = all.find((i) => i.id === fromIssueDragId(String(active.id)));
    if (!issue) return;

    // The drop target is either a group droppable (its id is the group id) or
    // another row, in which case we adopt that row's group and insert at its spot.
    const overId = String(over.id);
    let target: string;
    let overIssueId: string | null = null;
    if (groupIds.has(overId)) {
      target = overId;
    } else {
      const overIssue = all.find((i) => i.id === fromIssueDragId(overId));
      if (!overIssue) return;
      target = groupOf(overIssue);
      overIssueId = overIssue.id;
    }

    // Rank the issue among its new neighbours (dropping on a row inserts above it;
    // dropping on the section appends to the end).
    const groupItems = all.filter((i) => groupOf(i) === target && i.id !== issue.id);
    const at = overIssueId
      ? Math.max(
          0,
          groupItems.findIndex((i) => i.id === overIssueId),
        )
      : groupItems.length;
    const rank = rankBetween(groupItems[at - 1]?.rank, groupItems[at]?.rank);

    const groupChanged = groupOf(issue) !== target;
    if (!groupChanged && issue.rank === rank) return;
    updateIssue.mutate(
      {
        key: issue.key,
        update: { rank, ...(groupChanged ? { sprint_id: target === BACKLOG ? "" : target } : {}) },
      },
      { onError: (err) => toast.error(getApiErrorMessage(err)) },
    );
  };

  if (sprints.isLoading || issues.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <IssueFunctions
        slug={slug}
        spaceKey={spaceKey}
        filters={[]}
        members={members}
        onCompleteSprint={() => {}}
        onFilterChange={() => {}}
        onSearch={() => {}}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {openSprints.map((s) => {
          const items = all.filter((i) => i.sprint_id === s.id);
          return (
            <Section
              key={s.id}
              slug={slug}
              droppableId={s.id}
              title={s.name}
              subtitle={dateRange(s)}
              count={items.length}
              issues={items}
              emptyHint="Drag issues here to add them to this sprint."
              action={
                <div className="flex items-center gap-2">
                  <EditSprintDialog slug={slug} spaceKey={spaceKey} sprint={s} />
                  {s.status === "planned" ? (
                    <Button variant="outline" onClick={() => transition(s, "active", "Started")}>
                      Start sprint
                    </Button>
                  ) : (
                    <Button onClick={() => transition(s, "completed", "Completed")}>
                      Complete sprint
                    </Button>
                  )}
                </div>
              }
            />
          );
        })}
        <Section
          slug={slug}
          droppableId={BACKLOG}
          title="Backlog"
          count={backlog.length}
          issues={backlog}
          emptyHint="Your backlog is empty. Create issues from the Board, or add a sprint."
          action={
            <CreateSprintDialog slug={slug} spaceKey={spaceKey} defaultName={defaultSprintName} />
          }
        />
        <DragOverlay>
          {activeIssue ? (
            <div className="bg-background rounded-xs border shadow-xl">
              <BacklogRow issue={activeIssue} slug={slug} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
