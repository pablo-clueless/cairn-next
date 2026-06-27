"use client";

import Link from "next/link";
import { Loader2Icon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSpaces } from "@/hooks/use-spaces";
import { useStatuses } from "@/hooks/use-statuses";
import { useMembers } from "@/hooks/use-orgs";
import { useIssues } from "@/hooks/use-issues";
import { ISSUE_PRIORITIES, ISSUE_TYPES, type FilterCriteria } from "@/types";

const ALL = "__all__";
const ME = "me";

interface IssueFilterViewProps {
  slug: string;
  criteria: FilterCriteria;
  onChange?: (next: FilterCriteria) => void;
}

/** Editable filter controls + the matching issue list. Read-only when onChange is omitted. */
export const IssueFilterView = ({ slug, criteria, onChange }: IssueFilterViewProps) => {
  const spaces = useSpaces(slug);
  const members = useMembers(slug);
  const statuses = useStatuses(slug, criteria.space ?? "");
  const issues = useIssues(slug, {
    space: criteria.space,
    assignee: criteria.assignee,
    status: criteria.status_id,
    sprint: criteria.sprint,
  });

  // type/priority aren't server-side filters, so apply them here.
  const rows = (issues.data ?? []).filter(
    (i) =>
      (!criteria.type || i.type === criteria.type) &&
      (!criteria.priority || i.priority === criteria.priority),
  );

  const set = (patch: Partial<FilterCriteria>) => onChange?.({ ...criteria, ...patch });
  const editable = Boolean(onChange);

  return (
    <div className="space-y-4">
      {editable && (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={criteria.space ?? ALL}
            onValueChange={(v) =>
              set({ space: v === ALL ? undefined : v, status_id: undefined, sprint: undefined })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Space" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All spaces</SelectItem>
              {(spaces.data ?? []).map((sp) => (
                <SelectItem key={sp.id} value={sp.key}>
                  {sp.key} · {sp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {criteria.space && (
            <Select
              value={criteria.status_id ?? ALL}
              onValueChange={(v) => set({ status_id: v === ALL ? undefined : v })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any status</SelectItem>
                {(statuses.data ?? []).map((st) => (
                  <SelectItem key={st.id} value={st.id}>
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={criteria.assignee ?? ALL}
            onValueChange={(v) => set({ assignee: v === ALL ? undefined : v })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Anyone</SelectItem>
              <SelectItem value={ME}>Me</SelectItem>
              {members.data?.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={criteria.type ?? ALL}
            onValueChange={(v) =>
              set({ type: v === ALL ? undefined : (v as FilterCriteria["type"]) })
            }
          >
            <SelectTrigger className="w-36 capitalize">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any type</SelectItem>
              {ISSUE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="capitalize">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={criteria.priority ?? ALL}
            onValueChange={(v) =>
              set({ priority: v === ALL ? undefined : (v as FilterCriteria["priority"]) })
            }
          >
            <SelectTrigger className="w-36 capitalize">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any priority</SelectItem>
              {ISSUE_PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value} className="capitalize">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {issues.isLoading ? (
        <div className="grid place-items-center py-12">
          <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No issues match this filter.</p>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Key</th>
                <th className="px-3 py-2 text-left font-medium">Summary</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Assignee</th>
                <th className="px-3 py-2 text-left font-medium">Priority</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id} className="hover:bg-accent/40 border-t">
                  <td className="px-3 py-2">
                    <Link
                      href={`/org/${slug}/issues/${i.key}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {i.key}
                    </Link>
                  </td>
                  <td className="max-w-md truncate px-3 py-2">{i.title}</td>
                  <td className="px-3 py-2">{i.status}</td>
                  <td className="text-muted-foreground px-3 py-2">{i.assignee_name ?? "—"}</td>
                  <td className="px-3 py-2 capitalize">{i.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-muted-foreground border-t px-3 py-2 text-xs">{rows.length} issues</p>
        </div>
      )}
    </div>
  );
};
