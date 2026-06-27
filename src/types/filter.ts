import type { IssuePriority, IssueType } from "./work";

/**
 * Issue filter criteria. Space/assignee/status/sprint are applied server-side by
 * the issue list endpoint; type/priority are applied client-side.
 */
export interface FilterCriteria {
  space?: string; // space key
  status_id?: string;
  assignee?: string; // "me" or a user id
  sprint?: string; // sprint id or "backlog"
  type?: IssueType;
  priority?: IssuePriority;
}

/** A user's named, reusable issue filter. */
export interface SavedFilter {
  id: string;
  name: string;
  criteria: FilterCriteria;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFilterInput {
  name: string;
  criteria: FilterCriteria;
  is_starred?: boolean;
}

export interface FilterUpdate {
  name?: string;
  criteria?: FilterCriteria;
  is_starred?: boolean;
}
