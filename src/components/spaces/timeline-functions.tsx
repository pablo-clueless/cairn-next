import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "../ui/avatar";
import type { Issue, Member, QueryReturn } from "@/types";
import { getInitials } from "@/lib/string";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "../ui/combobox";
import { CalendarPlus } from "lucide-react";
import { ManageStatusesDialog } from "./manage-statuses-dialog";

interface Props {
  filters: string[];
  issues: QueryReturn<Issue[]>;
  members: QueryReturn<Member[]>;
  onFilterChange: (filters: string[]) => void;
  onSearch: (query: string) => void;
  slug: string;
  spaceKey: string;
}

export const TimelineFunctions = ({
  filters,
  issues,
  members,
  onFilterChange,
  onSearch,
  slug,
  spaceKey,
}: Props) => {
  const assignees = members.data || [];

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
        <Combobox>
          <ComboboxTrigger>
            <ComboboxValue placeholder="Type" />
          </ComboboxTrigger>
          <ComboboxContent></ComboboxContent>
        </Combobox>
      </div>
      <div className="flex items-center gap-x-4">
        <Button className="w-32" variant="outline"></Button>
        <Select>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent className="w-32"></SelectContent>
        </Select>
        <Button size="icon" variant="outline">
          <CalendarPlus className="size-4" />
        </Button>
        <ManageStatusesDialog slug={slug} spaceKey={spaceKey} />
      </div>
    </div>
  );
};
