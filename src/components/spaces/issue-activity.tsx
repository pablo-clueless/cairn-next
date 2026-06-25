"use client";

import { Loader2Icon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime, getInitials } from "@/lib/string";
import { useActivity } from "@/hooks/use-watchers";
import type { ActivityEvent } from "@/types";

interface IssueActivityProps {
  slug: string;
  issueKey: string;
}

/** Human-readable phrasing for an audit action. */
const ACTION_LABELS: Record<string, string> = {
  "issue.created": "created this issue",
  "issue.updated": "updated this issue",
  "issue.deleted": "deleted this issue",
  "issue.linked": "linked an issue",
  "issue.unlinked": "removed a link",
  "comment.created": "added a comment",
  "comment.updated": "edited a comment",
  "comment.deleted": "deleted a comment",
};

function actionText(event: ActivityEvent): string {
  return ACTION_LABELS[event.action] ?? event.action.replace(/[._]/g, " ");
}

export const IssueActivity = ({ slug, issueKey }: IssueActivityProps) => {
  const activity = useActivity(slug, issueKey);
  const events = activity.data ?? [];

  if (activity.isLoading) {
    return (
      <div className="grid place-items-center py-6">
        <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium">Activity</h2>
      {events.length === 0 ? (
        <p className="text-muted-foreground text-sm">No activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="flex items-center gap-2.5 text-sm">
              <Avatar className="size-6 shrink-0">
                <AvatarFallback className="text-[9px]">
                  {getInitials(event.actor_name ?? "—")}
                </AvatarFallback>
              </Avatar>
              <span>
                <span className="font-medium">{event.actor_name ?? "Someone"}</span>{" "}
                <span className="text-muted-foreground">{actionText(event)}</span>
              </span>
              <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                {formatRelativeTime(event.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
