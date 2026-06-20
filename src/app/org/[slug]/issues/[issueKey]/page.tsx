"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/client";
import { useMembers } from "@/hooks/use-orgs";
import { useStatuses } from "@/hooks/use-statuses";
import { useDeleteIssue, useIssue, useUpdateIssue } from "@/hooks/use-issues";
import { ISSUE_PRIORITIES, ISSUE_TYPES, type IssuePriority, type IssueType } from "@/types";

/** Radix Select forbids an empty-string value, so represent "no assignee" with a sentinel. */
const UNASSIGNED = "__unassigned__";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="text-muted-foreground text-xs">{label}</p>
    {children}
  </div>
);

const Page = () => {
  const { slug, issueKey } = useParams<{ slug: string; issueKey: string }>();
  const router = useRouter();
  const issue = useIssue(slug, issueKey);
  const members = useMembers(slug);
  const statuses = useStatuses(slug, issue.data?.space_key ?? "");
  const updateIssue = useUpdateIssue(slug);
  const deleteIssue = useDeleteIssue(slug);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  useEffect(() => {
    if (issue.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(issue.data.title);
      setDescription(issue.data.description ?? "");
    }
  }, [issue.data]);

  const patch = (update: Parameters<typeof updateIssue.mutate>[0]["update"]) =>
    updateIssue.mutate(
      { key: issueKey, update },
      { onError: (error) => toast.error(getApiErrorMessage(error)) },
    );

  if (issue.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }
  if (issue.isError || !issue.data) {
    return <p className="text-muted-foreground">Issue not found.</p>;
  }

  const it = issue.data;
  const dirty = title !== it.title || description !== (it.description ?? "");

  return (
    <div className="space-y-6">
      <Link
        href={`/org/${slug}/spaces/${it.space_key}`}
        className="text-muted-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeftIcon className="size-3.5" /> {it.space_key}
      </Link>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <p className="text-muted-foreground font-mono text-xs">{it.key}</p>
          <Input
            className="h-10 text-lg font-medium"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Field label="Description">
            <Textarea
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description…"
            />
          </Field>
          {dirty && (
            <div className="flex gap-2">
              <Button
                disabled={updateIssue.isPending}
                onClick={() => patch({ title: title.trim(), description })}
              >
                Save changes
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setTitle(it.title);
                  setDescription(it.description ?? "");
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <Field label="Status">
            <Select value={it.status_id} onValueChange={(v) => patch({ status_id: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(statuses.data ?? []).map((st) => (
                  <SelectItem key={st.id} value={st.id}>
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Type">
            <Select value={it.type} onValueChange={(v) => patch({ type: v as IssueType })}>
              <SelectTrigger className="w-full capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="capitalize">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Priority">
            <Select
              value={it.priority}
              onValueChange={(v) => patch({ priority: v as IssuePriority })}
            >
              <SelectTrigger className="w-full capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="capitalize">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Assignee">
            <Select
              value={it.assignee_id ?? UNASSIGNED}
              onValueChange={(v) => patch({ assignee_id: v === UNASSIGNED ? "" : v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {members.data?.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Due date">
            <Input
              type="date"
              value={it.due_date ? it.due_date.slice(0, 10) : ""}
              onChange={(e) => patch({ due_date: e.target.value })}
            />
          </Field>
          <Field label="Reporter">
            <p className="text-sm">{it.reporter_name ?? "—"}</p>
          </Field>
          <Button
            variant="destructive"
            disabled={deleteIssue.isPending}
            onClick={() => {
              if (!window.confirm(`Delete ${it.key}?`)) return;
              deleteIssue.mutate(it.key, {
                onSuccess: () => {
                  toast.success(`Deleted ${it.key}`);
                  router.replace(`/org/${slug}/spaces/${it.space_key}`);
                },
                onError: (error) => toast.error(getApiErrorMessage(error)),
              });
            }}
          >
            <Trash2Icon className="size-3.5" /> Delete issue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Page;
