"use client";

import { Loader2Icon } from "lucide-react";
import { useMemo } from "react";

import { DataTable } from "@/components/shared/data-table";
import { IssueFunctions } from "./issue-functions";
import { issueColumns } from "@/config/columns";
import { useIssues } from "@/hooks/use-issues";
import { useValues } from "@/hooks/use-values";
import { useMembers } from "@/hooks/use-orgs";
import { type Issue } from "@/types";

const PRIORITY_RANK: Record<string, number> = {
  highest: 5,
  high: 4,
  medium: 3,
  low: 2,
  lowest: 1,
};

// type SortKey = "updated" | "priority" | "key";

/** Tabular issue list with client-side filtering and sorting. */
export function IssueTable({ slug, spaceKey }: { slug: string; spaceKey: string }) {
  const issues = useIssues(slug, { space: spaceKey });
  const members = useMembers(slug);

  const { values } = useValues({
    assignee: "",
    status: "",
    type: "",
    sort: "",
  });

  const rows = useMemo(() => {
    let list = (issues.data ?? []).slice();
    if (values.status) list = list.filter((i) => i.status === values.status);
    if (values.type) list = list.filter((i) => i.type === values.type);
    if (values.assignee === "unassigned") list = list.filter((i) => !i.assignee_id);
    else if (values.assignee) list = list.filter((i) => i.assignee_id === values.assignee);

    list.sort((a: Issue, b: Issue) => {
      if (values.sort === "priority") return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      if (values.sort === "key") return a.number - b.number;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return list;
  }, [issues.data, values]);

  if (issues.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <IssueFunctions
        slug={slug}
        spaceKey={spaceKey}
        filters={[]}
        issues={issues}
        members={members}
        onCompleteSprint={() => {}}
        onFilterChange={() => {}}
        onSearch={() => {}}
      />
      <DataTable columns={issueColumns(slug)} data={rows} />
    </div>
  );
}
