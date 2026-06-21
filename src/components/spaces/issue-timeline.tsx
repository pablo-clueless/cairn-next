"use client";

import { ChevronDown, Info, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarQuarters,
  differenceInCalendarWeeks,
  format,
  isSameDay,
  isSameMonth,
  isSameQuarter,
  isSameWeek,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
} from "date-fns";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { TIMELINE_LEGENDS } from "@/constants/calendar";
import { useSprintIssues } from "@/hooks/use-issues";
import { IssueFunctions } from "./issue-functions";
import { useSprints, useDeleteSprint } from "@/hooks/use-sprints";
import { useMembers } from "@/hooks/use-orgs";
import { useAppContext } from "../providers";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";

type Timeline = "today" | "weeks" | "months" | "quarters";

const timelines: { label: string; value: Timeline }[] = [
  { label: "Today", value: "today" },
  { label: "Weeks", value: "weeks" },
  { label: "Months", value: "months" },
  { label: "Quarters", value: "quarters" },
];

// Per-view config: how to step the timeline, label each column, and decide which
// column a sprint's start date belongs to. `min`/`max` bound the column count so
// finer views (days/weeks) don't generate an unbounded number of columns.
const VIEWS: Record<
  Timeline,
  {
    add: (date: Date, amount: number) => Date;
    diff: (later: Date, earlier: Date) => number;
    same: (a: Date, b: Date) => boolean;
    start: (date: Date) => Date;
    label: (date: Date) => string;
    min: number;
    max: number;
  }
> = {
  today: {
    add: addDays,
    diff: differenceInCalendarDays,
    same: isSameDay,
    start: startOfDay,
    label: (d) => format(d, "d MMM"),
    min: 14,
    max: 120,
  },
  weeks: {
    add: addWeeks,
    diff: differenceInCalendarWeeks,
    same: (a, b) => isSameWeek(a, b, { weekStartsOn: 1 }),
    start: (d) => startOfWeek(d, { weekStartsOn: 1 }),
    label: (d) => format(d, "d MMM"),
    min: 8,
    max: 90,
  },
  months: {
    add: addMonths,
    diff: differenceInCalendarMonths,
    same: isSameMonth,
    start: startOfMonth,
    label: (d) => format(d, "MMM yyyy"),
    min: 6,
    max: 48,
  },
  quarters: {
    add: addQuarters,
    diff: differenceInCalendarQuarters,
    same: isSameQuarter,
    start: startOfQuarter,
    label: (d) => format(d, "QQQ yyyy"),
    min: 4,
    max: 24,
  },
};

// Fixed column width (matches the `w-50` header cells) so bar offsets can be
// computed in pixels rather than relying on layout measurement.
const COL_WIDTH = 200;

type Column = { date: Date };
type BarKind = "sprint" | "issue";

// Resolve a date range to the column span it covers. A missing start anchors to
// the first column (open on the left); a missing end runs to the last column
// (open on the right). Returns null when there's nothing to draw.
function barGeometry(
  columns: Column[],
  same: (a: Date, b: Date) => boolean,
  start: Date | null,
  end: Date | null,
) {
  if (!start && !end) return null;

  const indexOf = (d: Date) => {
    const i = columns.findIndex((c) => same(c.date, d));
    if (i !== -1) return i;
    return d < columns[0].date ? 0 : columns.length - 1;
  };

  const startIdx = start ? indexOf(start) : 0;
  const endIdx = end ? Math.max(startIdx, indexOf(end)) : columns.length - 1;
  return { startIdx, endIdx, hasStart: Boolean(start), hasEnd: Boolean(end) };
}

// Bars fade toward an open end to match the "No start/end date" legend.
function barFill(kind: BarKind, hasStart: boolean, hasEnd: boolean) {
  const sprint = kind === "sprint";
  if (!hasEnd) {
    return sprint
      ? "bg-linear-to-r from-primary-500 to-transparent text-white"
      : "bg-linear-to-r from-primary-300 to-transparent text-primary-900";
  }
  if (!hasStart) {
    return sprint
      ? "bg-linear-to-r from-transparent to-primary-500 text-white"
      : "bg-linear-to-r from-transparent to-primary-300 text-primary-900";
  }
  return sprint ? "bg-primary-500 text-white" : "bg-primary-200 text-primary-900";
}

function BarRow({
  columns,
  same,
  kind,
  label,
  start,
  end,
  onSelect,
}: {
  columns: Column[];
  same: (a: Date, b: Date) => boolean;
  kind: BarKind;
  label: string;
  start: Date | null;
  end: Date | null;
  onSelect?: () => void;
}) {
  const geo = barGeometry(columns, same, start, end);
  const dates = [start, end]
    .filter((d): d is Date => Boolean(d))
    .map((d) => format(d, "d MMM yyyy"));
  const title = dates.length ? `${label} · ${dates.join(" – ")}` : label;

  return (
    <div className="relative h-10">
      {geo && (
        <button
          type="button"
          onClick={onSelect}
          title={title}
          className={cn(
            "absolute top-1/2 flex h-6 -translate-y-1/2 cursor-pointer items-center rounded-xs px-2 transition hover:shadow hover:brightness-95",
            barFill(kind, geo.hasStart, geo.hasEnd),
          )}
          style={{
            left: geo.startIdx * COL_WIDTH + 6,
            width: (geo.endIdx - geo.startIdx + 1) * COL_WIDTH - 12,
          }}
        >
          <span className="truncate text-xs font-medium">{label}</span>
        </button>
      )}
    </div>
  );
}

export const IssueTimeline = ({ slug, spaceKey }: { slug: string; spaceKey: string }) => {
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<Timeline>("months");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const sprintIssues = useSprintIssues(slug, sprintId);
  const sprints = useSprints(slug, spaceKey);
  const deleteSprint = useDeleteSprint(slug, spaceKey);
  const { organization } = useAppContext();
  const members = useMembers(slug);
  const router = useRouter();

  const handleOpenSprint = (id: string) => {
    if (sprintId === id) {
      setSprintId(null);
    } else {
      setSprintId(id);
    }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const orgStart = organization?.created_at;
  const cfg = VIEWS[timeline];

  const q = query.trim().toLowerCase();
  const visibleSprints = q
    ? (sprints.data ?? []).filter((s) => s.name.toLowerCase().includes(q))
    : (sprints.data ?? []);
  const visibleIssues =
    q && sprintIssues.data
      ? sprintIssues.data.filter(
          (i) => i.title.toLowerCase().includes(q) || i.key.toLowerCase().includes(q),
        )
      : (sprintIssues.data ?? []);

  const columns = useMemo(() => {
    const start = cfg.start(orgStart ? new Date(orgStart) : new Date(2024, 0, 1));
    const data = sprints.data ?? [];

    let last = new Date();
    for (const s of data) {
      for (const iso of [s.start_date, s.end_date]) {
        if (iso) {
          const d = new Date(iso);
          if (d > last) last = d;
        }
      }
    }

    const span = Math.min(cfg.max, Math.max(cfg.min, cfg.diff(last, start) + 2));
    const today = new Date();
    return Array.from({ length: span }, (_, i) => {
      const date = cfg.add(start, i);
      return {
        key: `${timeline}-${i}`,
        date,
        label: cfg.label(date),
        isCurrent: cfg.same(date, today),
      };
    });
  }, [sprints.data, cfg, orgStart, timeline]);

  // Horizontal position of the "today" marker, interpolated within its column.
  const todayIdx = columns.findIndex((c) => c.isCurrent);
  let todayX: number | null = null;
  if (todayIdx !== -1) {
    const colStart = cfg.start(new Date());
    const colDays = differenceInCalendarDays(cfg.add(colStart, 1), colStart) || 1;
    const into = differenceInCalendarDays(new Date(), colStart);
    todayX = (todayIdx + Math.min(1, Math.max(0, into / colDays))) * COL_WIDTH;
  }

  return (
    <div className="relative h-full space-y-6">
      <IssueFunctions
        slug={slug}
        spaceKey={spaceKey}
        filters={[]}
        members={members}
        onFilterChange={() => {}}
        onSearch={setQuery}
        showGroup={false}
        showTrend={false}
      />
      {/* One scroll container so both panes share vertical scroll; the Work
          column sticks on horizontal scroll and the headers stick on vertical. */}
      <div className="h-[calc(100%-56px)] overflow-auto rounded-xs border">
        <div className="flex w-max">
          {/* Work column */}
          <div className="bg-background sticky left-0 z-20 w-80 shrink-0 border-r">
            <div className="bg-muted sticky top-0 z-30 flex h-10 items-center px-4 text-sm font-medium">
              Work
            </div>
            <div role="accordion">
              {visibleSprints.map((sprint) => {
                const isActive = sprintId === sprint.id;
                return (
                  <div className="border-b" key={sprint.id}>
                    <div className="flex h-10 w-full items-center justify-between px-4">
                      <div className="flex items-center gap-x-3">
                        <Checkbox
                          checked={selected.has(sprint.id)}
                          onCheckedChange={() => toggleSelect(sprint.id)}
                        />
                        <button onClick={() => handleOpenSprint(sprint.id)}>
                          <ChevronDown
                            className={cn(
                              "size-4 transition-transform duration-300",
                              isActive && "rotate-180",
                            )}
                          />
                        </button>
                        <span className="truncate text-xs">{sprint.name}</span>
                      </div>
                      <div className="flex items-center gap-x-2">
                        <button title="Add issue">
                          <Plus className="size-4" />
                        </button>
                        <Popover>
                          <PopoverTrigger title="Sprint actions">
                            <MoreHorizontal className="size-4" />
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-44 p-1">
                            <button
                              className="hover:bg-muted flex w-full items-center gap-x-2 rounded-xs px-2 py-1.5 text-left text-sm text-red-600"
                              onClick={() => deleteSprint.mutate(sprint.id)}
                            >
                              <Trash2 className="size-4" /> Delete sprint
                            </button>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="w-full overflow-hidden"
                      >
                        {sprintIssues.isLoading ? (
                          <div className="text-muted-foreground flex h-10 items-center px-4 pl-12 text-xs">
                            Loading…
                          </div>
                        ) : visibleIssues.length ? (
                          visibleIssues.map((issue) => (
                            <div
                              className="flex h-10 items-center justify-between px-4 pl-12"
                              key={issue.id}
                            >
                              <div className="flex items-center gap-x-2">
                                <Checkbox
                                  checked={selected.has(issue.id)}
                                  onCheckedChange={() => toggleSelect(issue.id)}
                                />
                                <span className="text-muted-foreground text-xs">{issue.key}</span>
                                <span className="truncate text-xs">{issue.title}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-muted-foreground flex h-10 items-center px-4 pl-12 text-xs">
                            No issues
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          <div className="shrink-0" style={{ width: columns.length * COL_WIDTH }}>
            <div className="sticky top-0 z-10 flex">
              {columns.map((column) => (
                <div
                  key={column.key}
                  style={{ width: COL_WIDTH }}
                  className={cn(
                    "flex h-10 shrink-0 items-center border-r px-4 text-sm font-medium last:border-r-0",
                    column.isCurrent ? "bg-primary-500 text-white" : "bg-muted",
                  )}
                >
                  {column.label}
                </div>
              ))}
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-0 flex">
                {columns.map((column) => (
                  <div
                    key={column.key}
                    style={{ width: COL_WIDTH }}
                    className="shrink-0 border-r last:border-r-0"
                  />
                ))}
              </div>
              {todayX !== null && (
                <div
                  className="bg-primary-500/70 pointer-events-none absolute top-0 bottom-0 z-10 w-px"
                  style={{ left: todayX }}
                />
              )}
              <div className="relative">
                {visibleSprints.map((sprint) => {
                  const isActive = sprintId === sprint.id;
                  const sStart = sprint.start_date ? new Date(sprint.start_date) : null;
                  const sEnd = sprint.end_date ? new Date(sprint.end_date) : null;
                  return (
                    <div className="border-b" key={sprint.id}>
                      <BarRow
                        columns={columns}
                        same={cfg.same}
                        kind="sprint"
                        label={sprint.name}
                        start={sStart}
                        end={sEnd}
                        onSelect={() => handleOpenSprint(sprint.id)}
                      />
                      {isActive &&
                        (sprintIssues.isLoading ? (
                          <div className="h-10" />
                        ) : visibleIssues.length ? (
                          visibleIssues.map((issue) => {
                            // Keep issue bars inside the sprint window: clamp the
                            // start up to the sprint start, fall back to its end.
                            let iStart = issue.created_at ? new Date(issue.created_at) : sStart;
                            if (iStart && sStart && iStart < sStart) iStart = sStart;
                            let iEnd = issue.due_date ? new Date(issue.due_date) : sEnd;
                            if (iStart && iEnd && iEnd < iStart) iEnd = iStart;
                            return (
                              <BarRow
                                key={issue.id}
                                columns={columns}
                                same={cfg.same}
                                kind="issue"
                                label={issue.title}
                                start={iStart}
                                end={iEnd}
                                onSelect={() => router.push(`/org/${slug}/issues/${issue.key}`)}
                              />
                            );
                          })
                        ) : (
                          <div className="h-10" />
                        ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-4 bottom-4 z-5! flex items-center gap-x-1 rounded-xs border bg-white p-1 shadow">
        {timelines.map(({ label, value }) => (
          <button
            className={cn(
              "rounded-xs px-2 py-1 text-sm font-medium",
              timeline === value ? "bg-primary-500 text-white" : "hover:bg-muted",
            )}
            key={value}
            onClick={() => setTimeline(value)}
          >
            {label}
          </button>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <button className="hover:bg-muted px-2 py-1">
              <Info className="size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end">
            {TIMELINE_LEGENDS.map((legend) => (
              <div className="space-y-2" key={legend.name}>
                <p className="text-sm font-medium">{legend.name}</p>
                <div className="space-y-2">
                  {legend.items.map((item) => (
                    <div className="flex items-center gap-x-2" key={item.name}>
                      {item.icon ? (
                        <item.icon className={cn("size-4", item.className)} />
                      ) : (
                        <div className={cn("h-4 w-8 rounded-xs", item.className)}></div>
                      )}
                      <span className="text-xs font-medium">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
