"use client";

import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import z from "zod";

import { FormField, ISSUE_PRIORITIES, ISSUE_TYPES } from "@/types";
import { useCreateIssue } from "@/hooks/use-issues";
import { useStatuses } from "@/hooks/use-statuses";
import { getApiErrorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Form } from "../form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const issuePriority = z.enum(ISSUE_PRIORITIES.map((p) => p.value));
const issueType = z.enum(ISSUE_TYPES.map((t) => t.value));

const schema = z.object({
  type: issueType,
  title: z.string().min(1),
  description: z.string().optional(),
  priority: issuePriority,
  statusId: z.string(),
  dueDate: z.date().optional(),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  type: "task",
  title: "",
  description: "",
  priority: "medium",
  statusId: "",
  dueDate: undefined,
};

export function CreateIssueDialog({ slug, spaceKey }: { slug: string; spaceKey: string }) {
  const { isPending, mutate } = useCreateIssue(slug, spaceKey);
  const statuses = useStatuses(slug, spaceKey);
  const [open, setOpen] = useState(false);

  const STATUSES = useMemo(() => {
    if (!statuses.data) return [];
    return statuses.data.map((status) => ({
      label: status.name,
      value: status.id,
    }));
  }, [statuses.data]);

  const fields: Record<keyof FormValues, FormField<FormValues>> = {
    priority: { label: "Priority", type: "select", options: ISSUE_PRIORITIES },
    statusId: { label: "Status", type: "select", options: STATUSES },
    title: { label: "Title", type: "text" },
    type: { label: "Type", type: "select", options: ISSUE_TYPES },
    dueDate: { label: "Due date", type: "date", placeholder: "No due date" },
    description: { label: "Description", type: "textarea" },
  };

  const handleSubmit = (values: FormValues) => {
    mutate(
      {
        type: values.type,
        title: values.title,
        description: values.description || undefined,
        status_id: values.statusId || undefined,
        priority: values.priority,
        due_date: values.dueDate ? format(values.dueDate, "yyyy-MM-dd") : undefined,
      },
      {
        onSuccess: (issue) => {
          toast.success(`Created ${issue.key}`);
          setOpen(false);
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !isPending && setOpen(open)}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon /> New issue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>New issue in {spaceKey}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Form defaultValues={defaultValues} fields={fields} schema={schema} onSubmit={handleSubmit}>
          {({ field }) => (
            <div className="space-y-6">
              <div className="space-y-4">
                {field("title")}
                <div className="grid grid-cols-2 gap-4">
                  <div>{field("priority")}</div>
                  <div>{field("statusId")}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>{field("type")}</div>
                  <div>{field("dueDate")}</div>
                </div>
                {field("description")}
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Creating…" : "Create issue"}
              </Button>
            </div>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  );
}
