"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { getInitials } from "@/lib/string";
import type { Issue } from "@/types";

/** A compact issue card for the Kanban board. */
export function IssueCard({ issue }: { issue: Issue }) {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="h-25 space-y-2.25">
      <p className="text-muted-foreground font-mono text-xs">{issue.key}</p>
      <Link
        href={`/org/${slug}/issues/${issue.key}`}
        className="block text-sm font-medium hover:underline"
      >
        {issue.title}
      </Link>
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span className="capitalize">
          {issue.type} · {issue.priority}
        </span>
        {issue.assignee_name && (
          <span
            title={issue.assignee_name}
            className="bg-muted grid size-5 place-items-center rounded-full text-[10px] font-medium"
          >
            {getInitials(issue.assignee_name)}
          </span>
        )}
      </div>
    </div>
  );
}
