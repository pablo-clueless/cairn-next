"use client";

import { ChevronDown, ChevronUp, Loader2Icon, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import {
  STATUS_CATEGORIES,
  STATUS_CATEGORY_LABELS,
  type StatusCategory,
  type WorkflowStatus,
} from "@/types";
import {
  useCreateStatus,
  useDeleteStatus,
  useReorderStatuses,
  useStatuses,
  useUpdateStatus,
} from "@/hooks/use-statuses";
import { getApiErrorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(STATUS_CATEGORIES),
  color: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = { name: "", category: "todo", color: "#6B7280" };

/** A single editable status row: recolor, rename, recategorize, reorder, delete. */
function StatusRow({
  slug,
  spaceKey,
  status,
  isFirst,
  isLast,
  onMove,
}: {
  slug: string;
  spaceKey: string;
  status: WorkflowStatus;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: "up" | "down") => void;
}) {
  const updateStatus = useUpdateStatus(slug, spaceKey);
  const deleteStatus = useDeleteStatus(slug, spaceKey);
  const [name, setName] = useState(status.name);
  const [wip, setWip] = useState(status.wip_limit ? String(status.wip_limit) : "");

  const patch = (update: Parameters<typeof updateStatus.mutate>[0]["update"]) =>
    updateStatus.mutate(
      { id: status.id, update },
      { onError: (e) => toast.error(getApiErrorMessage(e)) },
    );

  return (
    <div className="flex items-center gap-2 rounded-xs border px-2 py-1.5">
      <div className="flex flex-col">
        <button
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
          disabled={isFirst}
          onClick={() => onMove("up")}
          title="Move up"
        >
          <ChevronUp className="size-3.5" />
        </button>
        <button
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
          disabled={isLast}
          onClick={() => onMove("down")}
          title="Move down"
        >
          <ChevronDown className="size-3.5" />
        </button>
      </div>
      <input
        type="color"
        aria-label="Status color"
        title="Status color"
        className="size-8 shrink-0 cursor-pointer rounded-xs border bg-transparent p-0.5"
        value={status.color || "#6B7280"}
        onChange={(e) => patch({ color: e.target.value })}
      />
      <Input
        className="flex-1"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && name !== status.name && patch({ name: name.trim() })}
      />
      <Select
        value={status.category}
        onValueChange={(v) => patch({ category: v as StatusCategory })}
      >
        <SelectTrigger className="w-32 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {STATUS_CATEGORY_LABELS[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        min={0}
        className="w-16"
        placeholder="WIP"
        title="WIP limit (0 or empty = no limit)"
        value={wip}
        onChange={(e) => setWip(e.target.value)}
        onBlur={() => {
          const next = Math.max(0, Number(wip) || 0);
          if (next !== status.wip_limit) patch({ wip_limit: next });
        }}
      />
      <Button
        size="icon"
        variant="ghost"
        title={`Delete ${status.name}`}
        disabled={deleteStatus.isPending}
        onClick={() =>
          deleteStatus.mutate(status.id, {
            onSuccess: () => toast.success(`Removed "${status.name}"`),
            onError: (e) => toast.error(getApiErrorMessage(e)),
          })
        }
      >
        <Trash2 className="text-destructive size-4" />
      </Button>
    </div>
  );
}

export function ManageStatusesDialog({ slug, spaceKey }: { slug: string; spaceKey: string }) {
  const createStatus = useCreateStatus(slug, spaceKey);
  const reorderStatuses = useReorderStatuses(slug, spaceKey);
  const [values, setValues] = useState(defaultValues);
  const statuses = useStatuses(slug, spaceKey);
  const [open, setOpen] = useState(false);

  const ordered = [...(statuses.data ?? [])].sort((a, b) => a.position - b.position);

  const handleChange = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.message);
      return;
    }
    createStatus.mutate(values, {
      onSuccess: (status) => {
        toast.success(`Added "${status.name}"`);
        setValues(defaultValues);
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  const move = (index: number, dir: "up" | "down") => {
    const arr = [...ordered];
    const j = dir === "up" ? index - 1 : index + 1;
    if (j < 0 || j >= arr.length) return;
    [arr[index], arr[j]] = [arr[j], arr[index]];
    reorderStatuses.mutate(
      arr.map((s, i) => ({ id: s.id, position: i })),
      { onError: (e) => toast.error(getApiErrorMessage(e)) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" title="Manage statuses">
          <Settings2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>Workflow statuses</DialogTitle>
          <DialogDescription>
            Statuses become the columns of the {spaceKey} board. Reorder, rename, or recolor them.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          {statuses.isLoading ? (
            <div className="grid place-items-center py-6">
              <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
            </div>
          ) : ordered.length > 0 ? (
            ordered.map((status, i) => (
              <StatusRow
                key={status.id}
                slug={slug}
                spaceKey={spaceKey}
                status={status}
                isFirst={i === 0}
                isLast={i === ordered.length - 1}
                onMove={(dir) => move(i, dir)}
              />
            ))
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">No statuses yet.</p>
          )}
        </div>
        <form className="flex items-center gap-2 border-t pt-4" onSubmit={onAdd}>
          <input
            type="color"
            aria-label="New status color"
            title="Status color"
            className="size-9 shrink-0 cursor-pointer rounded-xs border bg-transparent p-0.5"
            value={values.color}
            onChange={(e) => handleChange("color", e.target.value)}
          />
          <Input
            className="flex-1"
            placeholder="New status name"
            value={values.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
          <Select
            value={values.category}
            onValueChange={(v) => handleChange("category", v as StatusCategory)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {STATUS_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={createStatus.isPending || !values.name.trim()}>
            {createStatus.isPending ? "Adding…" : "Add"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
