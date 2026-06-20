"use client";

import { ChevronDown, ChevronRight, Loader2Icon, PlusIcon } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

import { useCreateSprint, useSprints, useUpdateSprint } from "@/hooks/use-sprints";
import { IssueFunctions } from "./issue-functions";
import { type Issue, type Sprint } from "@/types";
import { getApiErrorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { useIssues } from "@/hooks/use-issues";
import { useMembers } from "@/hooks/use-orgs";
import { BacklogRow } from "./backlog-row";

function dateRange(s: Sprint): string {
  if (s.start_date && s.end_date) {
    return `${format(new Date(s.start_date), "d MMM")} - ${format(new Date(s.end_date), "d MMM")}`;
  }
  return "no dates set";
}

interface SectionProps {
  title: React.ReactNode;
  subtitle?: string;
  count: number;
  issues: Issue[];
  slug: string;
  action?: React.ReactNode;
  defaultOpen?: boolean;
  emptyHint?: string;
}

function Section({
  title,
  subtitle,
  count,
  issues,
  slug,
  action,
  defaultOpen = true,
  emptyHint,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <motion.section className="overflow-hidden rounded-xs border">
      <div className="bg-muted/40 flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Chevron className="size-4" />
        </button>
        <div className="flex flex-1 items-baseline gap-2">
          <span className="font-medium">{title}</span>
          {subtitle && <span className="text-muted-foreground text-xs">{subtitle}</span>}
          <span className="text-muted-foreground text-xs">({count} work items)</span>
        </div>
        {action}
      </div>
      {open &&
        (issues.length > 0 ? (
          <div>
            {issues.map((i) => (
              <BacklogRow key={i.id} issue={i} slug={slug} />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground border-t border-dashed px-3 py-6 text-center text-sm">
            {emptyHint ?? "No work items."}
          </div>
        ))}
    </motion.section>
  );
}

export function IssueBacklog({ slug, spaceKey }: { slug: string; spaceKey: string }) {
  const sprints = useSprints(slug, spaceKey);
  const issues = useIssues(slug, { space: spaceKey });
  const createSprint = useCreateSprint(slug, spaceKey);
  const updateSprint = useUpdateSprint(slug, spaceKey);
  const [query] = useState("");
  const members = useMembers(slug);

  if (sprints.isLoading || issues.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const matches = (i: Issue) =>
    !q || i.title.toLowerCase().includes(q) || i.key.toLowerCase().includes(q);
  const all = (issues.data ?? []).filter(matches);
  const openSprints = (sprints.data ?? []).filter((s) => s.status !== "completed");
  const backlog = all.filter((i) => !i.sprint_id);

  const onCreateSprint = () =>
    createSprint.mutate(
      { name: `${spaceKey} Sprint ${(sprints.data?.length ?? 0) + 1}` },
      {
        onSuccess: () => toast.success("Sprint created"),
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );

  const transition = (s: Sprint, status: "active" | "completed", label: string) =>
    updateSprint.mutate(
      { id: s.id, update: { status } },
      {
        onSuccess: () => toast.success(`${label} ${s.name}`),
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );

  return (
    <div className="space-y-4">
      <IssueFunctions
        slug={slug}
        spaceKey={spaceKey}
        filters={[]}
        issues={issues}
        members={members}
        onCompleteSprint={() => {}}
        onFilterChange={() => {}}
        onSearch={() => {}}
      />
      {openSprints.map((s) => {
        const items = all.filter((i) => i.sprint_id === s.id);
        return (
          <Section
            key={s.id}
            slug={slug}
            title={s.name}
            subtitle={dateRange(s)}
            count={items.length}
            issues={items}
            emptyHint="Drag or move issues into this sprint."
            action={
              s.status === "planned" ? (
                <Button variant="outline" onClick={() => transition(s, "active", "Started")}>
                  Start sprint
                </Button>
              ) : (
                <Button onClick={() => transition(s, "completed", "Completed")}>
                  Complete sprint
                </Button>
              )
            }
          />
        );
      })}
      <Section
        slug={slug}
        title="Backlog"
        count={backlog.length}
        issues={backlog}
        emptyHint="Your backlog is empty. Create issues from the Board, or add a sprint."
        action={
          <Button variant="outline" onClick={onCreateSprint} disabled={createSprint.isPending}>
            <PlusIcon /> Create sprint
          </Button>
        }
      />
    </div>
  );
}
