"use client";

import { Loader2Icon, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCreateStatus, useDeleteStatus, useStatuses } from "@/hooks/use-statuses";
import { STATUS_CATEGORIES, STATUS_CATEGORY_LABELS, type StatusCategory } from "@/types";
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

/** Manage a space's workflow statuses: list, add, and remove. */
export function ManageStatusesDialog({ slug, spaceKey }: { slug: string; spaceKey: string }) {
  const [open, setOpen] = useState(false);
  const statuses = useStatuses(slug, spaceKey);
  const createStatus = useCreateStatus(slug, spaceKey);
  const deleteStatus = useDeleteStatus(slug, spaceKey);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<StatusCategory>("todo");
  const [color, setColor] = useState("#6B7280");

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createStatus.mutate(
      { name: trimmed, category, color },
      {
        onSuccess: (status) => {
          toast.success(`Added "${status.name}"`);
          setName("");
          setCategory("todo");
          setColor("#6B7280");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const onDelete = (id: string, label: string) =>
    deleteStatus.mutate(id, {
      onSuccess: () => toast.success(`Removed "${label}"`),
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" title="Manage statuses">
          <Settings2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Workflow statuses</DialogTitle>
          <DialogDescription>
            Statuses become the columns of the {spaceKey} board.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          {statuses.isLoading ? (
            <div className="grid place-items-center py-6">
              <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
            </div>
          ) : statuses.data && statuses.data.length > 0 ? (
            statuses.data.map((status) => (
              <div
                key={status.id}
                className="flex items-center justify-between rounded-xs border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 shrink-0 rounded-full border"
                    style={{ backgroundColor: status.color || "transparent" }}
                  />
                  <span className="font-medium">{status.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {STATUS_CATEGORY_LABELS[status.category]}
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  title={`Delete ${status.name}`}
                  disabled={deleteStatus.isPending}
                  onClick={() => onDelete(status.id, status.name)}
                >
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">No statuses yet.</p>
          )}
        </div>

        <form className="flex items-center gap-2 border-t pt-4" onSubmit={onAdd}>
          <input
            type="color"
            aria-label="Status color"
            title="Status color"
            className="size-9 shrink-0 cursor-pointer rounded-xs border bg-transparent p-0.5"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <Input
            className="flex-1"
            placeholder="New status name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select value={category} onValueChange={(v) => setCategory(v as StatusCategory)}>
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
          <Button type="submit" disabled={createStatus.isPending || !name.trim()}>
            {createStatus.isPending ? "Adding…" : "Add"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
