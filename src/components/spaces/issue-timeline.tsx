"use client";

import { addMonths, format, isSameMonth, parseISO } from "date-fns";

import { IssueFunctions } from "./issue-functions";
import { useSprints } from "@/hooks/use-sprints";
import { useMembers } from "@/hooks/use-orgs";

export const IssueTimeline = ({ slug, spaceKey }: { slug: string; spaceKey: string }) => {
  const sprints = useSprints(slug, spaceKey);
  const members = useMembers(slug);

  const months = Array.from({ length: 48 }).map((_, index) => {
    const date = addMonths(new Date(2024, 0, 1), index);
    return {
      date: format(date, "MMM, yyyy"),
      sprints:
        sprints.data?.filter(
          (sprint) => sprint.start_date && isSameMonth(parseISO(sprint.start_date), date),
        ) ?? [],
    };
  });

  return (
    <div className="h-full space-y-6">
      <IssueFunctions
        slug={slug}
        spaceKey={spaceKey}
        filters={[]}
        members={members}
        onFilterChange={() => {}}
        onSearch={() => {}}
        showGroup={false}
        showTrend={false}
      />
      <div className="grid h-[calc(100%-56px)] grid-cols-7 rounded-xs border">
        <div className="col-span-2 border-r h-full">
          <div className="bg-muted h-10 text-sm flex font-medium items-center px-4">Work</div>
          <div></div>
        </div>
        <div className="col-span-5 h-full overflow-x-auto flex items-start">
          {months.map((month) => (
            <div className="min-w-75 border-r h-full last:border-r-0 " key={month.date}>
              <div className="bg-muted h-10 text-sm flex font-medium items-center px-4">{month.date}</div>
              <div className="h-[calc(100%-40px)] p-4 space-y-2">
                {month.sprints.map((sprint) => (
                  <div className="border rounded-xs p-2" key={sprint.id}>
                    <p className="text-sm font-medium">{sprint.name}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
