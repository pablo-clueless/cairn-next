/** The kinds of widget a dashboard can contain. */
export type WidgetType = "assigned_to_me" | "status_breakdown" | "sprint_progress";

/** A single widget on a dashboard. `id` is client-generated for stable keys. */
export interface Widget {
  id: string;
  type: WidgetType;
  title?: string;
  space?: string; // space key, for space-scoped widgets
}

/** A user's named collection of widgets. */
export interface Dashboard {
  id: string;
  name: string;
  widgets: Widget[];
  created_at: string;
  updated_at: string;
}

export interface CreateDashboardInput {
  name: string;
  widgets?: Widget[];
}

export interface DashboardUpdate {
  name?: string;
  widgets?: Widget[];
}
