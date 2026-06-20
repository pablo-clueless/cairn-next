import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { RelativeTimeCell, STATUS_STYLES, createColumns, type StatusVariant } from "./shared";
import { type Issue } from "@/types";
import { cn } from "@/lib/utils";

// Statuses are user-defined, so color by the status's category, not its name.
const STATUS_VARIANT: Record<string, StatusVariant> = {
  todo: "default",
  in_progress: "info",
  done: "success",
};

/** Issue table columns. Parameterized by org slug for issue links. */
export const issueColumns = (slug: string) =>
  createColumns<Issue>({
    columns: [
      {
        accessorKey: "key",
        header: "Key",
        cell: ({ row }) => (
          <Link
            className="text-muted-foreground font-mono text-xs hover:underline"
            href={`/org/${slug}/issues/${row.original.key}`}
          >
            {row.original.key}
          </Link>
        ),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <Link
            className="font-medium hover:underline"
            href={`/org/${slug}/issues/${row.original.key}`}
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <span className="capitalize">{row.original.type}</span>,
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => <span className="capitalize">{row.original.priority}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
              STATUS_STYLES[STATUS_VARIANT[row.original.status_category] ?? "default"],
            )}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "assignee_name",
        header: "Assignee",
        cell: ({ row }) =>
          row.original.assignee_name ? (
            <span className="text-muted-foreground">{row.original.assignee_name}</span>
          ) : null,
      },
      {
        accessorKey: "updated_at",
        header: "Updated",
        cell: ({ row }) => <RelativeTimeCell date={row.original.updated_at} />,
      },
    ],
    actions: (issue) => [
      { label: "Open", icon: ArrowUpRight, href: `/org/${slug}/issues/${issue.key}` },
    ],
  });
