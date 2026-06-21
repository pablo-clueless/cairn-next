"use client";

import { Loader2Icon, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { STATUS_CATEGORIES, STATUS_CATEGORY_LABELS, type StatusCategory } from "@/types";
import { useCreateStatus, useDeleteStatus, useStatuses } from "@/hooks/use-statuses";
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

const defautlValues: FormValues = {
  name: "",
  category: "todo",
  color: "",
};

export function ManageStatusesDialog({ slug, spaceKey }: { slug: string; spaceKey: string }) {
  const createStatus = useCreateStatus(slug, spaceKey);
  const deleteStatus = useDeleteStatus(slug, spaceKey);
  const statuses = useStatuses(slug, spaceKey);
  const [open, setOpen] = useState(false);

  const [values, setValues] = useState(defautlValues);

  const handleChange = <K extends keyof FormValues>(
    key: keyof FormValues,
    value: FormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

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
        setValues(defautlValues);
        setOpen(false);
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  const onDelete = (id: string, label: string) =>
    deleteStatus.mutate(id, {
      onSuccess: () => toast.success(`Removed "${label}"`),
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });

  const isLoading = createStatus.isPending || deleteStatus.isPending;

  return (
    <Dialog open={open} onOpenChange={(open) => !isLoading && setOpen(open)}>
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
