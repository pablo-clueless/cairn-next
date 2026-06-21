"use client";

import { Loader2Icon, Workflow } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { StatusTransition, TransitionInput, WorkflowStatus } from "@/types";
import { useTransitions, useSetTransitions } from "@/hooks/use-transitions";
import { getApiErrorMessage } from "@/lib/client";
import { useStatuses } from "@/hooks/use-statuses";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Sentinel for the global "from any status" row (serialized as from_status_id null).
const ANY = "*";
const edgeKey = (from: string, to: string) => `${from}->${to}`;

export function ManageTransitionsDialog({ slug, spaceKey }: { slug: string; spaceKey: string }) {
  const statuses = useStatuses(slug, spaceKey);
  const transitions = useTransitions(slug, spaceKey);
  const setTransitions = useSetTransitions(slug, spaceKey);
  const [open, setOpen] = useState(false);

  const list = statuses.data ?? [];
  const loading = statuses.isLoading || transitions.isLoading;

  const handleSave = (payload: TransitionInput[]) =>
    setTransitions.mutate(payload, {
      onSuccess: () => {
        toast.success("Workflow updated");
        setOpen(false);
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });

  return (
    <Dialog open={open} onOpenChange={(o) => !setTransitions.isPending && setOpen(o)}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" title="Workflow transitions">
          <Workflow className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Workflow</DialogTitle>
          <DialogDescription>
            Check which status changes the {spaceKey} board allows. Leave everything unchecked for
            an open workflow (any status to any other). The “Any status” row applies from every
            status.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="grid place-items-center py-8">
            <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">Add some statuses first.</p>
        ) : (
          // Remounts each time the dialog opens, so it seeds from the saved
          // workflow via a useState initializer (no state-syncing effect).
          <TransitionMatrix
            statuses={list}
            initial={transitions.data ?? []}
            saving={setTransitions.isPending}
            onSave={handleSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TransitionMatrix({
  statuses,
  initial,
  saving,
  onSave,
}: {
  statuses: WorkflowStatus[];
  initial: StatusTransition[];
  saving: boolean;
  onSave: (payload: TransitionInput[]) => void;
}) {
  const [edges, setEdges] = useState<Set<string>>(
    () => new Set(initial.map((t) => edgeKey(t.from_status_id ?? ANY, t.to_status_id))),
  );

  const toggle = (from: string, to: string) =>
    setEdges((prev) => {
      const next = new Set(prev);
      const k = edgeKey(from, to);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const save = () =>
    onSave(
      [...edges].map((k) => {
        const [from, to] = k.split("->");
        return { from_status_id: from === ANY ? null : from, to_status_id: to };
      }),
    );

  const rows = [{ id: ANY, name: "Any status" }, ...statuses];

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="text-muted-foreground px-2 py-1 text-left text-xs font-medium">
                From ╲ To
              </th>
              {statuses.map((to) => (
                <th
                  key={to.id}
                  className="px-2 py-1 text-center text-xs font-medium whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: to.color || "transparent" }}
                    />
                    {to.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((from) => (
              <tr key={from.id}>
                <td className="px-2 py-1 text-xs font-medium whitespace-nowrap">
                  {from.id === ANY ? (
                    <span className="text-muted-foreground italic">Any status</span>
                  ) : (
                    from.name
                  )}
                </td>
                {statuses.map((to) => (
                  <td key={to.id} className="px-2 py-1 text-center">
                    {from.id === to.id ? (
                      <span className="text-muted-foreground/40">—</span>
                    ) : (
                      <Checkbox
                        className="mx-auto"
                        checked={edges.has(edgeKey(from.id, to.id))}
                        onCheckedChange={() => toggle(from.id, to.id)}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <span className="text-muted-foreground text-xs">
          {edges.size === 0
            ? "Open workflow — all transitions allowed."
            : `${edges.size} transition${edges.size === 1 ? "" : "s"} allowed.`}
        </span>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save workflow"}
        </Button>
      </div>
    </>
  );
}
