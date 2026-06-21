"use client";

import { Loader2Icon } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { Kanban, type KanbanColumnConfig } from "@/components/shared/kanban";
import { useStatuses, useReorderStatuses } from "@/hooks/use-statuses";
import { useIssues, useUpdateIssue } from "@/hooks/use-issues";
import { IssueFunctions } from "./issue-functions";
import { getApiErrorMessage } from "@/lib/client";
import { useMembers } from "@/hooks/use-orgs";
import { IssueCard } from "./issue-card";
import { type Issue } from "@/types";

export function IssueBoard({ slug, spaceKey }: { slug: string; spaceKey: string }) {
  const reorderStatuses = useReorderStatuses(slug, spaceKey);
  const issues = useIssues(slug, { space: spaceKey });
  const statuses = useStatuses(slug, spaceKey);
  const updateIssue = useUpdateIssue(slug);
  const members = useMembers(slug);

  const COLUMNS: KanbanColumnConfig[] = useMemo(() => {
    if (!statuses.data) return [];
    return statuses.data.map((status) => ({
      id: status.id,
      title: status.name,
      color: status.color,
      position: status.position,
    }));
  }, [statuses]);

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

  if (issues.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <IssueFunctions
        slug={slug}
        spaceKey={spaceKey}
        filters={[]}
        members={members}
        onCompleteSprint={() => {}}
        onFilterChange={() => {}}
        onSearch={() => {}}
      />
      <Kanban<Issue>
        items={issues.data ?? []}
        groupBy="status_id"
        columns={COLUMNS}
        renderCard={(issue) => <IssueCard issue={issue} />}
        onColumnEdit={() => {}}
        onColumnDelete={() => {}}
        onColumnsReorder={handleReorder}
        onDragEnd={({ item, toStatus }) => {
          // toStatus is the destination column id, i.e. the target status_id.
          if (item.status_id === toStatus) return;
          updateIssue.mutate(
            { key: item.key, update: { status_id: toStatus } },
            { onError: (error) => toast.error(getApiErrorMessage(error)) },
          );
        }}
      />
    </div>
  );
}
