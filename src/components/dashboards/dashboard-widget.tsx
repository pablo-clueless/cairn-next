"use client";

import Link from "next/link";
import { Loader2Icon } from "lucide-react";

import { useIssues, useSprintIssues } from "@/hooks/use-issues";
import { useSprints } from "@/hooks/use-sprints";
import {
  STATUS_CATEGORIES,
  STATUS_CATEGORY_LABELS,
  type Issue,
  type Widget,
} from "@/types";

const Spinner = () => (
  <div className="grid place-items-center py-6">
    <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
  </div>
);

/** Renders a single dashboard widget's content based on its type. */
export const DashboardWidget = ({ slug, widget }: { slug: string; widget: Widget }) => {
  switch (widget.type) {
    case "assigned_to_me":
      return <AssignedToMe slug={slug} />;
    case "status_breakdown":
      return <StatusBreakdown slug={slug} space={widget.space} />;
    case "sprint_progress":
      return <SprintProgress slug={slug} space={widget.space} />;
    default:
      return <p className="text-muted-foreground text-sm">Unknown widget.</p>;
  }
};

const AssignedToMe = ({ slug }: { slug: string }) => {
  const issues = useIssues(slug, { assignee: "me" });
  if (issues.isLoading) return <Spinner />;
  const list = issues.data ?? [];
  if (list.length === 0) return <p className="text-muted-foreground text-sm">Nothing assigned.</p>;
  return (
    <ul className="space-y-1.5">
      {list.slice(0, 8).map((i) => (
        <li key={i.id} className="flex items-center gap-2 text-sm">
          <Link href={`/org/${slug}/issues/${i.key}`} className="font-mono text-xs hover:underline">
            {i.key}
          </Link>
          <span className="truncate">{i.title}</span>
          <span className="text-muted-foreground ml-auto shrink-0 text-xs">{i.status}</span>
        </li>
      ))}
      {list.length > 8 && (
        <li className="text-muted-foreground text-xs">+{list.length - 8} more</li>
      )}
    </ul>
  );
};

const StatusBreakdown = ({ slug, space }: { slug: string; space?: string }) => {
  const issues = useIssues(slug, space ? { space } : {});
  if (issues.isLoading) return <Spinner />;
  const all = issues.data ?? [];
  const max = Math.max(
    1,
    ...STATUS_CATEGORIES.map((c) => all.filter((i) => i.status_category === c).length),
  );
  return (
    <div className="space-y-2">
      {STATUS_CATEGORIES.map((c) => {
        const value = all.filter((i: Issue) => i.status_category === c).length;
        return (
          <div key={c} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0">{STATUS_CATEGORY_LABELS[c]}</span>
            <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
              <div className="bg-brand h-full rounded-full" style={{ width: `${(value / max) * 100}%` }} />
            </div>
            <span className="text-muted-foreground w-6 shrink-0 text-right">{value}</span>
          </div>
        );
      })}
    </div>
  );
};

const SprintProgress = ({ slug, space }: { slug: string; space?: string }) => {
  const sprints = useSprints(slug, space ?? "");
  const active = sprints.data?.find((s) => s.status === "active");
  const issues = useSprintIssues(slug, active?.id);

  if (!space) return <p className="text-muted-foreground text-sm">Configure a space for this widget.</p>;
  if (sprints.isLoading) return <Spinner />;
  if (!active) return <p className="text-muted-foreground text-sm">No active sprint in {space}.</p>;
  if (issues.isLoading) return <Spinner />;

  const list = issues.data ?? [];
  const done = list.filter((i) => i.status_category === "done").length;
  const pct = list.length === 0 ? 0 : Math.round((done / list.length) * 100);
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{active.name}</p>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div className="bg-brand h-full rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-muted-foreground text-xs">
        {done} of {list.length} issues done ({pct}%)
      </p>
    </div>
  );
};
