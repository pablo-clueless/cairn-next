"use client";

import { Pencil } from "lucide-react";
import { addDays } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { useUpdateSprint } from "@/hooks/use-sprints";
import { getApiErrorMessage } from "@/lib/client";
import { isWeekday, nextWeekday } from "@/lib/weekday";
import { Button } from "@/components/ui/button";
import { type FormField, type Sprint } from "@/types";
import { Form } from "../form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const schema = z
  .object({
    name: z.string().min(1, "Name is required"),
    startDate: z.date().refine(isWeekday, "Start date must be a weekday (Mon–Fri)"),
    endDate: z.date().refine(isWeekday, "End date must be a weekday (Mon–Fri)"),
  })
  .refine((v) => v.endDate >= v.startDate, {
    path: ["endDate"],
    message: "End date must be on or after the start date",
  });

type FormValues = z.infer<typeof schema>;

export function EditSprintDialog({
  slug,
  spaceKey,
  sprint,
}: {
  slug: string;
  spaceKey: string;
  sprint: Sprint;
}) {
  const { isPending, mutate } = useUpdateSprint(slug, spaceKey);
  const [open, setOpen] = useState(false);

  // Pre-fill from the sprint; a dateless sprint falls back to a sensible
  // two-week range. Snap to a weekday so the form opens in a valid state even if
  // an older sprint still carries a weekend date.
  const fallbackStart = nextWeekday(new Date());
  const defaultValues: FormValues = {
    name: sprint.name,
    startDate: nextWeekday(sprint.start_date ? new Date(sprint.start_date) : fallbackStart),
    endDate: nextWeekday(sprint.end_date ? new Date(sprint.end_date) : addDays(fallbackStart, 14)),
  };

  const fields: Record<keyof FormValues, FormField<FormValues>> = {
    name: { label: "Name", type: "text" },
    startDate: { label: "Start date", type: "date" },
    endDate: { label: "End date", type: "date" },
  };

  const handleSubmit = (values: FormValues) => {
    mutate(
      {
        id: sprint.id,
        update: {
          name: values.name,
          start_date: values.startDate.toISOString(),
          end_date: values.endDate.toISOString(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Sprint updated");
          setOpen(false);
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && setOpen(o)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Edit sprint">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Edit {sprint.name}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Form defaultValues={defaultValues} fields={fields} schema={schema} onSubmit={handleSubmit}>
          {({ field }) => (
            <div className="space-y-6">
              <div className="space-y-4">
                {field("name")}
                <div className="grid grid-cols-2 gap-4">
                  <div>{field("startDate")}</div>
                  <div>{field("endDate")}</div>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  );
}
