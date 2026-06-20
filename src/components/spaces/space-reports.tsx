"use client";

import { Loader2Icon } from "lucide-react";

import { useIssues } from "@/hooks/use-issues";
import { ISSUE_PRIORITIES, ISSUE_STATUSES, ISSUE_TYPES, STATUS_LABELS, type Issue } from "@/types";

interface Row {
  label: string;
  value: number;
}

function BarChart({ title, rows }: { title: string; rows: Row[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="space-y-2">
      <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</h3>
      <div className="space-y-2 rounded-xs border p-4">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 text-sm">
            <span className="w-28 shrink-0 capitalize">{r.label}</span>
            <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-brand h-full rounded-full"
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </div>
            <span className="text-muted-foreground w-6 shrink-0 text-right">{r.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SpaceReports({ slug, spaceKey }: { slug: string; spaceKey: string }) {
  const issues = useIssues(slug, { space: spaceKey });

  if (issues.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  const all = issues.data ?? [];
  const tally = (pred: (i: Issue) => boolean) => all.filter(pred).length;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <BarChart
        title="Status"
        rows={ISSUE_STATUSES.map((s) => ({
          label: STATUS_LABELS[s],
          value: tally((i) => i.status === s),
        }))}
      />
      <BarChart
        title="Type"
        rows={ISSUE_TYPES.map((t) => ({ label: t, value: tally((i) => i.type === t) }))}
      />
      <BarChart
        title="Priority"
        rows={ISSUE_PRIORITIES.map((p) => ({ label: p, value: tally((i) => i.priority === p) }))}
      />
    </div>
  );
}
