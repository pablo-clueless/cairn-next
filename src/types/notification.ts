export type NotificationType = "mention" | "comment" | "assigned" | "activity";

/** One entry in the current user's personal inbox. */
export interface Notification {
  id: string;
  type: NotificationType;
  actor_id: string | null;
  actor_name: string | null;
  org_slug: string;
  issue_id: string | null;
  issue_key: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

/** Per-user email opt-ins for notifications. */
export interface NotificationPreferences {
  email_mentions: boolean;
  email_comments: boolean;
  email_assignments: boolean;
}

export interface NotificationPreferencesUpdate {
  email_mentions?: boolean;
  email_comments?: boolean;
  email_assignments?: boolean;
}
