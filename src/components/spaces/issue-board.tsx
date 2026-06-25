"use client";

import { Loader2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useTransitions, isTransitionAllowed } from "@/hooks/use-transitions";
import { useStatuses, useReorderStatuses } from "@/hooks/use-statuses";
import { useIssues, useUpdateIssue } from "@/hooks/use-issues";
import { ISSUE_PRIORITIES, type Issue } from "@/types";
import { IssueFunctions } from "./issue-functions";
import { getApiErrorMessage } from "@/lib/client";
import { useSprints } from "@/hooks/use-sprints";
import { useMembers } from "@/hooks/use-orgs";
import { rankBetween } from "@/lib/rank";
import { IssueCard } from "./issue-card";
import {
  Kanban,
  type KanbanColumnConfig,
  type KanbanDragEndEvent,
} from "@/components/shared/kanban";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Board scope: all issues, just the backlog, or a single sprint (the Scrum view).
const ALL = "all";
const BACKLOG = "backlog";
const UNASSIGNED = "__unassigned__";

type Swimlane = "none" | "assignee" | "priority";

const SWIMLANES: { label: string; value: Swimlane }[] = [
  { label: "No swimlanes", value: "none" },
  { label: "By assignee", value: "assignee" },
  { label: "By priority", value: "priority" },
];

export function IssueBoard({ slug, spaceKey }: { slug: string; spaceKey: string }) {
  const reorderStatuses = useReorderStatuses(slug, spaceKey);
  const issues = useIssues(slug, { space: spaceKey });
  const statuses = useStatuses(slug, spaceKey);
  const transitions = useTransitions(slug, spaceKey);
  const sprints = useSprints(slug, spaceKey);
  const updateIssue = useUpdateIssue(slug);
  const members = useMembers(slug);

  // null = "auto": default to the active sprint (Scrum board) when one exists.
  const [scope, setScope] = useState<string | null>(null);
  const [swimlane, setSwimlane] = useState<Swimlane>("none");
  const activeSprintId = sprints.data?.find((s) => s.status === "active")?.id;
  const effectiveScope = scope ?? activeSprintId ?? ALL;

  const visibleIssues = useMemo(() => {
    const all = [...(issues.data ?? [])].sort((a, b) => a.rank - b.rank);
    if (effectiveScope === ALL) return all;
    if (effectiveScope === BACKLOG) return all.filter((i) => !i.sprint_id);
    return all.filter((i) => i.sprint_id === effectiveScope);
  }, [issues.data, effectiveScope]);

  const COLUMNS: KanbanColumnConfig[] = useMemo(() => {
    if (!statuses.data) return [];
    return statuses.data.map((status) => ({
      id: status.id,
      title: status.name,
      color: status.color,
      position: status.position,
      wipLimit: status.wip_limit,
    }));
  }, [statuses]);

  // Split the visible issues into swimlanes (bands) for the selected grouping.
  const lanes = useMemo(() => {
    if (swimlane === "assignee") {
      const groups = new Map<string, { title: string; items: Issue[] }>();
      for (const i of visibleIssues) {
        const id = i.assignee_id ?? UNASSIGNED;
        if (!groups.has(id)) groups.set(id, { title: i.assignee_name ?? "Unassigned", items: [] });
        groups.get(id)!.items.push(i);
      }
      return [...groups.entries()].map(([id, g]) => ({ id, title: g.title, items: g.items }));
    }
    if (swimlane === "priority") {
      return [...ISSUE_PRIORITIES]
        .reverse() // highest → lowest
        .map((p) => ({
          id: p.value,
          title: p.label,
          items: visibleIssues.filter((i) => i.priority === p.value),
        }))
        .filter((l) => l.items.length > 0);
    }
    return [];
  }, [swimlane, visibleIssues]);

  const handleReorder = (columns: KanbanColumnConfig[]) => {
    if (!statuses.data) return;
    const positionById = new Map(columns.map((col, index) => [col.id, index]));
    const updated = statuses.data.map((status) => ({
      id: status.id,
      position: positionById.get(status.id) ?? status.position,
    }));
    reorderStatuses.mutate(updated, {
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  // Drag handler scoped to a list of issues (the whole board, or one swimlane),
  // so the new rank is computed against the right set of neighbours.
  const makeDragEnd =
    (laneItems: Issue[]) =>
    ({ item, toStatus, fromIndex, toIndex }: KanbanDragEndEvent<Issue>) => {
      const statusChanged = item.status_id !== toStatus;
      // Pre-check the workflow so an invalid drop fails instantly (server enforces too).
      if (statusChanged && !isTransitionAllowed(transitions.data, item.status_id, toStatus)) {
        const target = statuses.data?.find((s) => s.id === toStatus);
        toast.error(`Can't move "${item.title}" to ${target?.name ?? "that status"}`);
        return;
      }
      const dest = laneItems
        .filter((i) => i.status_id === toStatus && i.id !== item.id)
        .sort((a, b) => a.rank - b.rank);
      let at = toIndex;
      if (!statusChanged && fromIndex < toIndex) at -= 1; // account for the removed card above
      at = Math.max(0, Math.min(at, dest.length));
      const rank = rankBetween(dest[at - 1]?.rank, dest[at]?.rank);

      updateIssue.mutate(
        { key: item.key, update: { rank, ...(statusChanged ? { status_id: toStatus } : {}) } },
        { onError: (error) => toast.error(getApiErrorMessage(error)) },
      );
    };

  const renderBoard = (laneItems: Issue[], compact = false) => (
    <Kanban<Issue>
      items={laneItems}
      groupBy="status_id"
      columns={COLUMNS}
      compact={compact}
      renderCard={(issue) => <IssueCard issue={issue} />}
      onColumnsReorder={handleReorder}
      onDragEnd={makeDragEnd(laneItems)}
    />
  );

  if (issues.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <IssueFunctions
            slug={slug}
            spaceKey={spaceKey}
            filters={[]}
            members={members}
            onCompleteSprint={() => {}}
            onFilterChange={() => {}}
            onSearch={() => {}}
          />
        </div>
        <Select value={swimlane} onValueChange={(v) => setSwimlane(v as Swimlane)}>
          <SelectTrigger className="w-40 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SWIMLANES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={effectiveScope} onValueChange={setScope}>
          <SelectTrigger className="w-44 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All issues</SelectItem>
            <SelectItem value={BACKLOG}>Backlog</SelectItem>
            {(sprints.data ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
                {s.status === "active" ? " (active)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {swimlane === "none" ? (
        renderBoard(visibleIssues)
      ) : lanes.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">No issues to show.</p>
      ) : (
        <div className="space-y-4">
          {lanes.map((lane) => (
            <div key={lane.id} className="rounded-xs border">
              <div className="bg-muted/40 flex items-center gap-2 border-b px-3 py-2">
                <span className="text-sm font-medium">{lane.title}</span>
                <span className="text-muted-foreground text-xs">({lane.items.length})</span>
              </div>
              <div className="p-2">{renderBoard(lane.items, true)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
