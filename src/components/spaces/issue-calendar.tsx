"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { TimelineFunctions } from "./timeline-functions";
import { DAYS_OF_WEEK } from "@/constants/calendar";
import { useSprints } from "@/hooks/use-sprints";
import { useIssues } from "@/hooks/use-issues";
import { useMembers } from "@/hooks/use-orgs";
import { cn } from "@/lib/utils";

type CalendarSpan = {
  id: string;
  title: string;
  kind: "sprint" | "issue";
  start: Date;
  end: Date;
};

type WeekSegment = {
  key: string;
  span: CalendarSpan;
  colStart: number;
  colSpan: number;
  lane: number;
  continuesLeft: boolean;
  continuesRight: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function buildWeekSegments(week: Date[], spans: CalendarSpan[]): WeekSegment[] {
  const weekStart = week[0];
  const weekEnd = week[week.length - 1];

  const overlapping = spans
    .filter((span) => span.start <= weekEnd && span.end >= weekStart)
    .map((span) => ({
      span,
      startIdx: clamp(differenceInCalendarDays(span.start, weekStart), 0, 4),
      endIdx: clamp(differenceInCalendarDays(span.end, weekStart), 0, 4),
    }))
    .sort((a, b) => a.startIdx - b.startIdx || b.endIdx - a.endIdx);

  const laneEnds: number[] = []; // last occupied column index per lane

  return overlapping.map(({ span, startIdx, endIdx }) => {
    let lane = laneEnds.findIndex((end) => end < startIdx);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = endIdx;

    return {
      key: `${span.kind}-${span.id}`,
      span,
      colStart: startIdx + 1,
      colSpan: endIdx - startIdx + 1,
      lane,
      continuesLeft: span.start < weekStart,
      continuesRight: span.end > weekEnd,
    };
  });
}

export const IssueCalendar = ({ slug, spaceKey }: { slug: string; spaceKey: string }) => {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const sprints = useSprints(slug, spaceKey);
  const members = useMembers(slug);
  const issues = useIssues(slug);

  const handleDateChange = (dir: "next" | "prev" | "today") => {
    setCurrentDate((prev) => {
      switch (dir) {
        case "next":
          return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
        case "prev":
          return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
        case "today":
        default: {
          const today = new Date();
          return new Date(today.getFullYear(), today.getMonth(), 1);
        }
      }
    });
  };

  const weeks = useMemo<Date[][]>(() => {
    const gridStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const monthEnd = endOfMonth(currentDate);
    const result: Date[][] = [];
    for (let cursor = gridStart; cursor <= monthEnd; cursor = addDays(cursor, 7)) {
      result.push(Array.from({ length: 5 }, (_, i) => addDays(cursor, i)));
    }
    return result;
  }, [currentDate]);

  const spans = useMemo<CalendarSpan[]>(() => {
    const result: CalendarSpan[] = [];
    for (const sprint of sprints.data ?? []) {
      if (!sprint.start_date || !sprint.end_date) continue;
      const start = startOfDay(parseISO(sprint.start_date));
      const end = startOfDay(parseISO(sprint.end_date));
      if (end < start) continue;
      result.push({ id: sprint.id, title: sprint.name, kind: "sprint", start, end });
    }

    for (const issue of issues.data ?? []) {
      if (!issue.due_date) continue;
      const end = startOfDay(new Date(issue.due_date));
      const created = startOfDay(new Date(issue.created_at));
      result.push({
        id: issue.id,
        title: issue.title,
        kind: "issue",
        start: created < end ? created : end,
        end,
      });
    }

    return result;
  }, [sprints.data, issues.data]);

  return (
    <div className="flex items-start gap-4 space-y-6">
      <div className="flex-1 space-y-6">
        <TimelineFunctions
          currentDate={currentDate}
          filters={[]}
          issues={issues}
          members={members}
          onDateChange={handleDateChange}
          onFilterChange={() => {}}
          onScheduleOpen={() => setIsScheduleOpen(!isScheduleOpen)}
          onSearch={() => {}}
          slug={slug}
          spaceKey={spaceKey}
        />
        <div className="overflow-hidden rounded-xs border">
          <div className="bg-muted grid grid-cols-5">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.value} className="border-r py-2 text-center text-sm last:border-none">
                {day.label}
              </div>
            ))}
          </div>
          <div>
            {weeks.map((week, weekIndex) => {
              const segments = buildWeekSegments(week, spans);
              const laneCount = segments.reduce((max, seg) => Math.max(max, seg.lane + 1), 0);
              return (
                <div
                  key={weekIndex}
                  className="relative grid grid-cols-5 border-b last:border-none"
                  style={{ minHeight: Math.max(96, 32 + laneCount * 24) }}
                >
                  {week.map((day) => {
                    const inMonth = isSameMonth(day, currentDate);
                    const today = isToday(day);

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn("border-r p-1.5 last:border-none", !inMonth && "bg-muted/40")}
                      >
                        <span
                          className={cn(
                            "flex size-6 items-center justify-center rounded-full text-xs",
                            today && "bg-primary-500 font-medium text-white",
                            !inMonth && !today && "text-muted-foreground",
                          )}
                        >
                          {format(day, "d")}
                        </span>
                      </div>
                    );
                  })}
                  <div className="pointer-events-none absolute inset-x-0 top-8 grid grid-cols-5 gap-x-px gap-y-1 px-1">
                    {segments.map((seg) => (
                      <div
                        key={seg.key}
                        title={seg.span.title}
                        className={cn(
                          "pointer-events-auto h-5 truncate rounded-xs border px-1.5 text-[11px] leading-4.5",
                          seg.continuesLeft && "rounded-l-none border-l-0",
                          seg.continuesRight && "rounded-r-none border-r-0",
                          seg.span.kind === "sprint"
                            ? "border-primary-200 bg-primary-100 text-primary-800"
                            : "border-blue-200 bg-blue-100 text-blue-700",
                        )}
                        style={{
                          gridColumn: `${seg.colStart} / span ${seg.colSpan}`,
                          gridRow: seg.lane + 1,
                        }}
                      >
                        {!seg.continuesLeft && seg.span.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className={cn("", isScheduleOpen ? "flex-1" : "hidden w-0")}>
        <div className="rounded-xs border p-4">
          <div className="flex w-full items-center justify-between">
            <p className="font-medium">Unscheduled Work</p>
            <button onClick={() => setIsScheduleOpen(false)}>
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
