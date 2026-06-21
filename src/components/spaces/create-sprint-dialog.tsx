"use client";

import { PlusIcon } from "lucide-react";
import { addDays } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { useCreateSprint } from "@/hooks/use-sprints";
import { getApiErrorMessage } from "@/lib/client";
import { isWeekday, nextWeekday } from "@/lib/weekday";
import { Button } from "@/components/ui/button";
import { FormField } from "@/types";
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

export function CreateSprintDialog({
  slug,
  spaceKey,
  defaultName,
}: {
  slug: string;
  spaceKey: string;
  defaultName: string;
}) {
  const { isPending, mutate } = useCreateSprint(slug, spaceKey);
  const [open, setOpen] = useState(false);

  // Snap the default start to a weekday so the pre-filled form is valid; +14 days
  // keeps the same weekday, so the end stays valid too.
  const start = nextWeekday(new Date());
  const defaultValues: FormValues = {
    name: defaultName,
    startDate: start,
    endDate: addDays(start, 14),
  };

  const fields: Record<keyof FormValues, FormField<FormValues>> = {
    name: { label: "Name", type: "text" },
    startDate: { label: "Start date", type: "date" },
    endDate: { label: "End date", type: "date" },
  };

  const handleSubmit = (values: FormValues) => {
    mutate(
      {
        name: values.name,
        start_date: values.startDate.toISOString(),
        end_date: values.endDate.toISOString(),
      },
      {
        onSuccess: () => {
          toast.success("Sprint created");
          setOpen(false);
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && setOpen(o)}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusIcon /> Create sprint
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>New sprint in {spaceKey}</DialogTitle>
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
                {isPending ? "Creating…" : "Create sprint"}
              </Button>
            </div>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  );
}
