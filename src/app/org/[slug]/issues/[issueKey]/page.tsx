"use client";

import { ArrowLeftIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { subDays } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

import { ISSUE_PRIORITIES, ISSUE_TYPES, type IssuePriority, type IssueType } from "@/types";
import { useDeleteIssue, useIssue, useIssues, useUpdateIssue } from "@/hooks/use-issues";
import { useIssueRealtime } from "@/hooks/use-realtime";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/string";
import { useUserStore } from "@/store";
import { IssueWatchButton } from "@/components/spaces/issue-watch-button";
import { IssueActivity } from "@/components/spaces/issue-activity";
import { IssueAttachments } from "@/components/spaces/issue-attachments";
import { IssueComments } from "@/components/spaces/issue-comments";
import { IssueLinks } from "@/components/spaces/issue-links";
import { Textarea } from "@/components/ui/textarea";
import { useStatuses } from "@/hooks/use-statuses";
import { getApiErrorMessage } from "@/lib/client";
import { DatePicker } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMembers } from "@/hooks/use-orgs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const spaceIssues = useIssues(slug, { space: issue.data?.space_key ?? "" });
  const viewers = useIssueRealtime(slug, issueKey, issue.data?.id);
  const me = useUserStore((s) => s.user);
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
  const allIssues = spaceIssues.data ?? [];
  const children = allIssues.filter((i) => i.parent_id === it.id);
  // Parent candidates: any other issue in the space (the server rejects cycles).
  const parentOptions = allIssues.filter((i) => i.id !== it.id);
  // Co-viewers currently in this issue's realtime room, excluding yourself.
  const others = viewers.filter((v) => v.id !== me?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/org/${slug}/spaces/${it.space_key}`}
          className="text-muted-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-3.5" /> {it.space_key}
        </Link>
        {others.length > 0 && (
          <div className="flex items-center gap-1.5" title={others.map((v) => v.name).join(", ")}>
            <div className="flex -space-x-2">
              {others.slice(0, 4).map((v) => (
                <Avatar key={v.id} className="size-6 ring-background ring-2">
                  <AvatarFallback className="text-[9px]">{getInitials(v.name)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-muted-foreground text-xs">viewing</span>
          </div>
        )}
      </div>
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
          {children.length > 0 && (
            <Field label="Child issues">
              <ul className="space-y-1.5">
                {children.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 text-sm">
                    <Link
                      href={`/org/${slug}/issues/${c.key}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {c.key}
                    </Link>
                    <span className="text-muted-foreground truncate">{c.title}</span>
                  </li>
                ))}
              </ul>
            </Field>
          )}
          <div className="border-t pt-6">
            <IssueLinks slug={slug} issueKey={issueKey} />
          </div>
          <div className="border-t pt-6">
            <IssueAttachments slug={slug} issueKey={issueKey} />
          </div>
          <div className="border-t pt-6">
            <IssueComments slug={slug} issueKey={issueKey} />
          </div>
          <div className="border-t pt-6">
            <IssueActivity slug={slug} issueKey={issueKey} />
          </div>
        </div>
        <div className="space-y-4">
          <IssueWatchButton slug={slug} issueKey={issueKey} />
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
          <Field label="Parent">
            <Select
              value={it.parent_id ?? UNASSIGNED}
              onValueChange={(v) => patch({ parent_id: v === UNASSIGNED ? "" : v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No parent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>No parent</SelectItem>
                {parentOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="font-mono text-xs">{p.key}</span> {p.title}
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
            <DatePicker
              type="single"
              onValueChange={(value) => value && patch({ due_date: new Date(value).toISOString() })}
              value={it.due_date ? new Date(it.due_date) : undefined}
              minDate={subDays(new Date(), 1)}
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
