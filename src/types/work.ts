import { Bookmark, Bug, LucideIcon, SquareCheck, SquareStack, Zap } from "lucide-react";

export type IssuePriority = "lowest" | "low" | "medium" | "high" | "highest";
export type IssueType = "epic" | "story" | "task" | "bug" | "subtask";
export type IssueStatus = "todo" | "in_progress" | "done";

export const ISSUE_STATUSES: IssueStatus[] = ["todo", "in_progress", "done"];
export const ISSUE_PRIORITIES: { label: string; value: IssuePriority }[] = [
  { label: "Lowest", value: "lowest" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Highest", value: "highest" },
];
export const ISSUE_TYPES: { label: string; value: IssueType }[] = [
  { label: "Epic", value: "epic" },
  { label: "Story", value: "story" },
  { label: "Task", value: "task" },
  { label: "Bug", value: "bug" },
  { label: "Subtask", value: "subtask" },
];
type IssueTypeGroup = {
  name: string;
  issue_types: Array<{
    label: string;
    value: string;
    icon?: LucideIcon;
  }>;
};

export const ISSUE_TYPE_GROUPS: IssueTypeGroup[] = [
  {
    name: "",
    issue_types: [
      { label: "All standard work types", value: "all-standard" },
      { label: "All sub-tasks", value: "all-subtask" },
    ],
  },
  {
    name: "Standard work type",
    issue_types: [
      { label: "Epic", value: "epic", icon: Zap },
      { label: "Bug", value: "bug", icon: Bug },
      { label: "Story", value: "story", icon: Bookmark },
      { label: "Task", value: "task", icon: SquareCheck },
    ],
  },
  { name: "Subtasks", issue_types: [{ label: "Subtasks", value: "subtask", icon: SquareStack }] },
];

export const STATUS_LABELS: Record<IssueStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

/** Status category — drives board grouping/coloring and "done" semantics. */
export type StatusCategory = "todo" | "in_progress" | "done";
export const STATUS_CATEGORIES: StatusCategory[] = ["todo", "in_progress", "done"];
export const STATUS_CATEGORY_LABELS: Record<StatusCategory, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

/** A user-defined workflow status within a space. */
export interface WorkflowStatus {
  id: string;
  organization_id: string;
  space_id: string;
  name: string;
  category: StatusCategory;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CreateStatusInput {
  name: string;
  category: StatusCategory;
  color?: string;
}

export interface StatusUpdate {
  name?: string;
  category?: StatusCategory;
  color?: string;
  position?: number;
}

/** A single status's partial change in a bulk update (matched by id). */
export interface StatusPatch {
  id: string;
  name?: string;
  category?: StatusCategory;
  color?: string;
  position?: number;
}

export interface Space {
  id: string;
  organization_id: string;
  key: string;
  name: string;
  description?: string | null;
  lead_id?: string | null;
  created_by?: string | null;
  issue_count: number;
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  organization_id: string;
  space_id: string;
  space_key: string;
  number: number;
  key: string;
  type: IssueType;
  title: string;
  description?: string | null;
  status_id: string;
  status: string; // status name, e.g. "To Do"
  status_category: string;
  priority: IssuePriority;
  assignee_id?: string | null;
  assignee_name?: string | null;
  reporter_id?: string | null;
  reporter_name?: string | null;
  sprint_id?: string | null;
  due_date?: string | null; // YYYY-MM-DD (date-only); may include a time component from the API
  created_at: string;
  updated_at: string;
}

export type SprintStatus = "planned" | "active" | "completed";

export interface Sprint {
  id: string;
  organization_id: string;
  space_id: string;
  name: string;
  goal?: string | null;
  status: SprintStatus;
  start_date?: string | null;
  end_date?: string | null;
  completed_at?: string | null;
  issue_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSprintInput {
  name: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
}

export interface SprintUpdate {
  name?: string;
  goal?: string;
  status?: SprintStatus;
  start_date?: string;
  end_date?: string;
}

export interface CreateSpaceInput {
  key: string;
  name: string;
  description?: string;
}

export interface CreateIssueInput {
  type?: IssueType;
  title: string;
  description?: string;
  status_id?: string; // defaults to the space's first workflow status
  priority?: IssuePriority;
  assignee_id?: string;
  due_date?: string; // YYYY-MM-DD; omit/empty for no due date
}

export interface IssueUpdate {
  type?: IssueType;
  title?: string;
  description?: string;
  status_id?: string; // the workflow status to move the issue to
  priority?: IssuePriority;
  assignee_id?: string; // "" unassigns
  due_date?: string; // "" clears the due date
  /** @deprecated backend ignores this; use status_id. Kept until all callers migrate. */
  status?: IssueStatus;
}
