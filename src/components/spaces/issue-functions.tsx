import { ListFilter, MoreHorizontal, TrendingUp } from "lucide-react";

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "../ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ManageTransitionsDialog } from "./manage-transitions-dialog";
import { ManageStatusesDialog } from "./manage-statuses-dialog";
import { ManageSpaceMembersDialog } from "./manage-space-members-dialog";
import type { Member, QueryReturn } from "@/types";
import { getInitials } from "@/lib/string";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface Props {
  filters: string[];
  members: QueryReturn<Member[]>;
  onFilterChange: (filters: string[]) => void;
  onSearch: (query: string) => void;
  slug: string;
  spaceKey: string;
  onCompleteSprint?: () => void;
  showTrend?: boolean;
}

// const GROUPS = [
//   { label: "None", value: "none" },
//   { label: "Assignee", value: "assignee" },
//   { label: "Epic", value: "epic" },
//   { label: "Subtask", value: "subtask" },
// ];

export const IssueFunctions = ({
  slug,
  spaceKey,
  members,
  onCompleteSprint,
  onSearch,
  showTrend = true,
}: Props) => {
  const assignees = [
    ...new Set(members.data?.map((issue) => issue.name).filter((name): name is string => !!name)),
  ];

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-x-4">
        <Input
          className="w-48"
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search board"
          type="search"
        />
        <div className="flex items-center gap-x-4">
          {assignees.length > 0 && (
            <AvatarGroup>
              {assignees.slice(0, 3).map((assignee) => (
                <Avatar className="border-none" key={assignee} size="sm">
                  <AvatarFallback>{getInitials(assignee)}</AvatarFallback>
                </Avatar>
              ))}
              {assignees.length > 3 && <AvatarGroupCount>{assignees.length - 3}</AvatarGroupCount>}
            </AvatarGroup>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button className="w-32 justify-start" variant="outline">
                <ListFilter className="size-4" /> Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-125 gap-0 p-0">
              <div className="grid w-full grid-cols-5">
                <div className="col-span-2 border-r p-4"></div>
                <div className="col-span-3 p-4"></div>
              </div>
              <div className="h-8 w-full bg-gray-200"></div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="flex items-center gap-x-4">
        {onCompleteSprint && (
          <Button className="w-32" onClick={onCompleteSprint}>
            Complete Sprint
          </Button>
        )}
        {showTrend && (
          <Button size="icon" variant="outline">
            <TrendingUp className="size-4" />
          </Button>
        )}
        <ManageSpaceMembersDialog slug={slug} spaceKey={spaceKey} />
        <ManageStatusesDialog slug={slug} spaceKey={spaceKey} />
        <ManageTransitionsDialog slug={slug} spaceKey={spaceKey} />
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="outline">
              <MoreHorizontal className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-40"></PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
