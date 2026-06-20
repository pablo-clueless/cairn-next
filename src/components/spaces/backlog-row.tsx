"use client";

import Link from "next/link";
import {
  Bookmark,
  Bug,
  CheckSquare,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  ChevronUp,
  Equal,
  GitBranchPlus,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/client";
import { useUpdateIssue } from "@/hooks/use-issues";
import { getInitials } from "@/lib/string";
import {
  ISSUE_STATUSES,
  STATUS_LABELS,
  type Issue,
  type IssuePriority,
  type IssueStatus,
  type IssueType,
} from "@/types";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<IssueType, LucideIcon> = {
  epic: Layers,
  story: Bookmark,
  task: CheckSquare,
  bug: Bug,
  subtask: GitBranchPlus,
};
const TYPE_COLOR: Record<IssueType, string> = {
  epic: "text-purple-600",
  story: "text-green-600",
  task: "text-blue-600",
  bug: "text-red-600",
  subtask: "text-sky-600",
};
const PRIORITY: Record<IssuePriority, { icon: LucideIcon; color: string }> = {
  highest: { icon: ChevronsUp, color: "text-red-600" },
  high: { icon: ChevronUp, color: "text-orange-500" },
  medium: { icon: Equal, color: "text-amber-500" },
  low: { icon: ChevronDown, color: "text-blue-500" },
  lowest: { icon: ChevronsDown, color: "text-gray-400" },
};

export function BacklogRow({ issue, slug }: { issue: Issue; slug: string }) {
  const updateIssue = useUpdateIssue(slug);
  const TypeIcon = TYPE_ICON[issue.type];
  const prio = PRIORITY[issue.priority];
  const href = `/org/${slug}/issues/${issue.key}`;

  return (
    <div className="hover:bg-muted/40 flex items-center gap-3 border-t px-3 py-2 text-sm">
      <TypeIcon className={cn("size-4 shrink-0", TYPE_COLOR[issue.type])} aria-label={issue.type} />
      <Link
        href={href}
        className="text-muted-foreground shrink-0 font-mono text-xs hover:underline"
      >
        {issue.key}
      </Link>
      <Link href={href} className="flex-1 truncate hover:underline">
        {issue.title}
      </Link>

      <span className="bg-muted text-muted-foreground hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase sm:inline">
        {issue.type}
      </span>

      <Select
        value={issue.status}
        onValueChange={(v) =>
          updateIssue.mutate(
            { key: issue.key, update: { status: v as IssueStatus } },
            { onError: (e) => toast.error(getApiErrorMessage(e)) },
          )
        }
      >
        <SelectTrigger className="h-7 w-32 shrink-0 text-xs tracking-wide uppercase">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ISSUE_STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="text-xs uppercase">
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <prio.icon className={cn("size-4 shrink-0", prio.color)} aria-label={issue.priority} />

      {issue.assignee_name && (
        <span
          title={issue.assignee_name}
          className="bg-brand grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-medium text-white"
        >
          {getInitials(issue.assignee_name)}
        </span>
      )}
    </div>
  );
}
