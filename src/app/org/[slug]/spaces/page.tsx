"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { z } from "zod";

import { useCreateSpace, useSpaces } from "@/hooks/use-spaces";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodForm } from "@/lib/zod-resolver";
import { useOrg } from "@/hooks/use-orgs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const schema = z.object({
  key: z
    .string()
    .regex(/^[A-Za-z][A-Za-z0-9]{1,9}$/, "2-10 letters/digits, starting with a letter"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});
type Values = z.infer<typeof schema>;

const Page = () => {
  const { slug } = useParams<{ slug: string }>();
  const org = useOrg(slug);
  const canManage = org.data?.role === "owner" || org.data?.role === "admin";

  const spaces = useSpaces(slug);
  const createSpace = useCreateSpace(slug);
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodForm(schema) });

  const onSubmit = handleSubmit((values) => {
    createSpace.mutate(
      { key: values.key.toUpperCase(), name: values.name, description: values.description },
      {
        onSuccess: () => {
          toast.success("Space created");
          setOpen(false);
          reset();
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold">Spaces</h1>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon /> New space
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create space</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={onSubmit} noValidate>
                <div className="space-y-1">
                  <label htmlFor="key" className="text-sm font-medium">
                    Key
                  </label>
                  <Input
                    id="key"
                    placeholder="ENG"
                    aria-invalid={Boolean(errors.key)}
                    {...register("key")}
                  />
                  {errors.key && <p className="text-brand text-xs">{errors.key.message}</p>}
                </div>
                <div className="space-y-1">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    placeholder="Engineering"
                    aria-invalid={Boolean(errors.name)}
                    {...register("name")}
                  />
                  {errors.name && <p className="text-brand text-xs">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <Textarea id="description" rows={3} {...register("description")} />
                </div>
                <Button type="submit" className="w-full" disabled={createSpace.isPending}>
                  {createSpace.isPending ? "Creating…" : "Create space"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {spaces.isLoading ? (
        <div className="grid h-full place-items-center py-16">
          <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
        </div>
      ) : spaces.data && spaces.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.data.map((sp) => (
            <Link
              key={sp.id}
              href={`/org/${slug}/spaces/${sp.key}`}
              className="hover:border-brand rounded-xs border p-4 transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{sp.name}</p>
                <span className="bg-muted rounded px-1.5 py-0.5 text-xs">{sp.key}</span>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">{sp.issue_count} issue(s)</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="h-full rounded-xs border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No spaces yet.</p>
          {canManage && (
            <p className="text-muted-foreground text-sm">Create one to start tracking work.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Page;
