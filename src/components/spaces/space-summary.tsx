"use client";

import { Cell, Pie, PieChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { CheckCircle2, Clock, FilePlus2, Loader2Icon, PencilLine } from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";

import { useStatuses } from "@/hooks/use-statuses";
import { useIssues } from "@/hooks/use-issues";
import { cn } from "@/lib/utils";
import { ISSUE_PRIORITIES, ISSUE_TYPES, type Issue } from "@/types";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const DAY = 24 * 60 * 60 * 1000;

const within7d = (iso: string) => Date.now() - new Date(iso).getTime() <= 7 * DAY;

/** Top stat card: big number with an icon and a "in the last 7 days" caption. */
const StatCard = ({
  icon: Icon,
  value,
  label,
  caption,
}: {
  icon: typeof Clock;
  value: number | string;
  label: string;
  caption: string;
}) => (
  <div className="rounded-xs border p-4">
    <div className="flex items-center gap-3">
      <div className="bg-muted grid size-9 place-items-center rounded-xs">
        <Icon className="text-muted-foreground size-4" />
      </div>
      <div>
        <p className="text-lg leading-none font-semibold">
          {value} <span className="text-sm font-medium">{label}</span>
        </p>
        <p className="text-muted-foreground mt-1 text-xs">{caption}</p>
      </div>
    </div>
  </div>
);

const SectionCard = ({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={cn("space-y-3 rounded-xs border p-4", className)}>
    <div>
      <h3 className="text-sm font-medium">{title}</h3>
      {description && <p className="text-muted-foreground text-xs">{description}</p>}
    </div>
    {children}
  </section>
);

/** A labelled horizontal distribution bar with the percentage inside the fill. */
const DistBar = ({ label, pct }: { label: React.ReactNode; pct: number }) => (
  <div className="flex items-center gap-3 text-sm">
    <div className="flex w-28 shrink-0 items-center gap-1.5 truncate capitalize">{label}</div>
    <div className="bg-muted relative h-6 flex-1 overflow-hidden rounded">
      <div
        className="bg-foreground/15 h-full rounded transition-all"
        style={{ width: `${Math.max(pct, pct > 0 ? 6 : 0)}%` }}
      />
      <span className="absolute top-1/2 left-2 -translate-y-1/2 text-xs font-medium">{pct}%</span>
    </div>
  </div>
);

const count = (issues: Issue[], pred: (i: Issue) => boolean) => issues.filter(pred).length;

export function SpaceSummary({ slug, spaceKey }: { slug: string; spaceKey: string }) {
  const issues = useIssues(slug, { space: spaceKey });
  const statuses = useStatuses(slug, spaceKey);

  const data = useMemo(() => {
    const all = issues.data ?? [];
    const total = all.length;

    // Status overview is driven by the space's own workflow statuses (dynamic,
    // user-defined), counted by status_id and coloured with each status's colour.
    const statusData = [...(statuses.data ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        key: s.id,
        label: s.name,
        value: count(all, (i) => i.status_id === s.id),
        color: s.color,
      }));

    // Priority chart, ordered highest → lowest to mirror the reference layout.
    const priorityData = [...ISSUE_PRIORITIES].reverse().map((p) => ({
      priority: p.label,
      count: count(all, (i) => i.priority === p.value),
    }));

    const typeData = ISSUE_TYPES.map((t) => ({
      type: t,
      pct: total ? Math.round((count(all, (i) => i.type === t.value) / total) * 100) : 0,
    })).sort((a, b) => b.pct - a.pct);

    // Workload grouped by assignee (null → Unassigned), highest share first.
    const byAssignee = new Map<string, number>();
    for (const i of all) {
      const name = i.assignee_name ?? "Unassigned";
      byAssignee.set(name, (byAssignee.get(name) ?? 0) + 1);
    }
    const workload = [...byAssignee.entries()]
      .map(([name, n]) => ({ name, pct: total ? Math.round((n / total) * 100) : 0 }))
      .sort((a, b) => b.pct - a.pct);

    const recent = [...all]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 6);

    return {
      total,
      completed7d: count(all, (i) => i.status_category === "done" && within7d(i.updated_at)),
      updated7d: count(all, (i) => within7d(i.updated_at)),
      created7d: count(all, (i) => within7d(i.created_at)),
      unassigned: count(all, (i) => !i.assignee_id),
      statusData,
      priorityData,
      typeData,
      workload,
      recent,
    };
  }, [issues.data, statuses.data]);

  if (issues.isLoading || statuses.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  const statusConfig = Object.fromEntries(
    data.statusData.map((s) => [s.label, { label: s.label, color: s.color }]),
  ) satisfies ChartConfig;

  const priorityConfig = {
    count: { label: "Issues", color: "var(--color-primary-500)" },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6 py-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          value={data.completed7d}
          label="completed"
          caption="in the last 7 days"
        />
        <StatCard
          icon={PencilLine}
          value={data.updated7d}
          label="updated"
          caption="in the last 7 days"
        />
        <StatCard
          icon={FilePlus2}
          value={data.created7d}
          label="created"
          caption="in the last 7 days"
        />
        <StatCard
          icon={Clock}
          value={data.unassigned}
          label="unassigned"
          caption="needs an assignee"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Status overview" description="A snapshot of work items by status.">
          {data.total > 0 ? (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative">
                <ChartContainer config={statusConfig} className="aspect-square h-50">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
                    <Pie
                      data={data.statusData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={62}
                      strokeWidth={4}
                    >
                      {data.statusData.map((s) => (
                        <Cell key={s.key} fill={s.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold">{data.total}</span>
                  <span className="text-muted-foreground text-xs">Total items</span>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                {data.statusData.map((s) => (
                  <li key={s.key} className="flex items-center gap-2">
                    <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: s.color }} />
                    <span className="text-muted-foreground">{s.label}:</span>
                    <span className="font-medium">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">No issues yet.</p>
          )}
        </SectionCard>
        <SectionCard title="Recent activity" description="Recently updated work items.">
          {data.recent.length > 0 ? (
            <ul className="divide-y text-sm">
              {data.recent.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2">
                  <Link
                    href={`/org/${slug}/issues/${i.key}`}
                    className="min-w-0 flex-1 truncate hover:underline"
                  >
                    <span className="text-muted-foreground font-mono text-xs">{i.key}</span>{" "}
                    {i.title}
                  </Link>
                  <span className="bg-muted shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                    {i.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">No recent activity.</p>
          )}
        </SectionCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Priority breakdown" description="How work is being prioritized.">
          {data.total > 0 ? (
            <ChartContainer config={priorityConfig} className="max-h-56 w-full">
              <BarChart accessibilityLayer data={data.priorityData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="priority" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">No issues yet.</p>
          )}
        </SectionCard>

        <SectionCard title="Types of work" description="A breakdown of work items by type.">
          <div className="space-y-2.5">
            {data.typeData.map((t) => (
              <DistBar key={t.type.value} label={t.type.value} pct={t.pct} />
            ))}
          </div>
        </SectionCard>
      </div>
      <SectionCard title="Team workload" description="The share of work items per assignee.">
        {data.workload.length > 0 ? (
          <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
            {data.workload.map((w) => (
              <DistBar
                key={w.name}
                label={<span className="normal-case">{w.name}</span>}
                pct={w.pct}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">No issues yet.</p>
        )}
      </SectionCard>
    </div>
  );
}
