import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useMemo } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ManageStatusesDialog } from "./manage-statuses-dialog";
import { ISSUE_TYPE_GROUPS, type Issue, type Member, type QueryReturn } from "@/types";
import { MONTHS_OF_YEAR } from "@/constants/calendar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Combobox,
  ComboboxCheckboxItem,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "../ui/combobox";

type TypeItem = (typeof ISSUE_TYPE_GROUPS)[number]["issue_types"][number];
type TypeGroup = { label: string; items: TypeItem[] };

interface Props {
  currentDate: Date;
  filters: string[];
  issues: QueryReturn<Issue[]>;
  members: QueryReturn<Member[]>;
  onDateChange: (dir: "next" | "prev" | "today") => void;
  onFilterChange: (filters: string[]) => void;
  onScheduleOpen: () => void;
  onSearch: (query: string) => void;
  slug: string;
  spaceKey: string;
}

export const TimelineFunctions = ({
  currentDate,
  members,
  onDateChange,
  onFilterChange,
  onScheduleOpen,
  onSearch,
  slug,
  spaceKey,
}: Props) => {
  const assignees = members.data || [];

  // base-ui's grouped-combobox shape: each group needs a `label` and an `items` array.
  const typeGroups = useMemo<TypeGroup[]>(
    () => ISSUE_TYPE_GROUPS.map((group) => ({ label: group.name, items: group.issue_types })),
    [],
  );

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-x-4">
        <Input
          className="w-48"
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search board"
          type="search"
        />
        <Select>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            {assignees.map((assignee) => (
              <SelectItem key={assignee.user_id} value={assignee.user_id}>
                {assignee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Combobox
          items={typeGroups}
          multiple
          onValueChange={(value) => onFilterChange(value as string[])}
        >
          <ComboboxTrigger className="w-52 overflow-hidden">
            <ComboboxValue placeholder="Type" />
          </ComboboxTrigger>
          <ComboboxContent className="w-70">
            <ComboboxInput placeholder="Search Type" showSearch showTrigger={false} />
            <ComboboxList>
              <ComboboxCollection>
                {(group: TypeGroup) => (
                  <ComboboxGroup key={group.label || "all"} items={group.items}>
                    {group.label && <ComboboxLabel>{group.label}</ComboboxLabel>}
                    <ComboboxCollection>
                      {(item: TypeItem) => {
                        const Icon = item.icon;
                        return (
                          <ComboboxCheckboxItem key={item.value} value={item.value}>
                            {Icon && <Icon className="size-4" />}
                            {item.label}
                          </ComboboxCheckboxItem>
                        );
                      }}
                    </ComboboxCollection>
                  </ComboboxGroup>
                )}
              </ComboboxCollection>
            </ComboboxList>
            <ComboboxEmpty>No types found</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
      </div>
      <div className="flex items-center gap-x-4">
        <Button className="w-32" onClick={() => onDateChange("today")} variant="outline">
          Today
        </Button>
        <div className="border-primary-500 flex items-center rounded-xs border">
          <Button onClick={() => onDateChange("prev")} size="icon" variant="ghost">
            <ChevronLeft className="size-4" />
          </Button>
          <p className="text-primary-500 w-20 px-2 text-sm">{format(currentDate, "MMM yyyy")}</p>
          <Button onClick={() => onDateChange("next")} size="icon" variant="ghost">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Select>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent className="w-32">
            {MONTHS_OF_YEAR.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={onScheduleOpen} size="icon" variant="outline">
          <CalendarPlus className="size-4" />
        </Button>
        <ManageStatusesDialog slug={slug} spaceKey={spaceKey} />
      </div>
    </div>
  );
};
