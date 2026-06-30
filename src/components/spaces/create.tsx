"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { getApiErrorMessage } from "@/lib/client";
import { zodForm } from "@/lib/zod-resolver";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCreateSpace } from "@/hooks/use-spaces";
import { useCreateDashboard } from "@/hooks/use-dashboards";
import { useCreateFilter } from "@/hooks/use-filters";
import { useOrg } from "@/hooks/use-orgs";

interface Props {
  segment: string;
  slug: string;
}

const LABELS: Record<string, string> = {
  spaces: "space",
  dashboards: "dashboard",
  filters: "filter",
};

export const Create = ({ segment, slug }: Props) => {
  const org = useOrg(slug);
  const [open, setOpen] = useState(false);

  // Spaces are admin-only to create; dashboards and filters are personal.
  const canManage = org.data?.role === "owner" || org.data?.role === "admin";
  if (segment === "spaces" && !canManage) return null;
  if (!LABELS[segment]) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button onClick={(e) => e.stopPropagation()} aria-label={`New ${LABELS[segment]}`}>
          <Plus className="size-4" />
        </button>
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>New {LABELS[segment]}</DialogTitle>
          <DialogDescription className="sr-only">Create a new {LABELS[segment]}.</DialogDescription>
        </DialogHeader>
        {segment === "spaces" && <CreateSpaceForm slug={slug} onDone={() => setOpen(false)} />}
        {segment === "dashboards" && <CreateDashboardForm slug={slug} onDone={() => setOpen(false)} />}
        {segment === "filters" && <CreateFilterForm slug={slug} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
};

const spaceSchema = z.object({
  key: z.string().regex(/^[A-Za-z][A-Za-z0-9]{1,9}$/, "2-10 letters/digits, starting with a letter"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});
type SpaceValues = z.infer<typeof spaceSchema>;

const CreateSpaceForm = ({ slug, onDone }: { slug: string; onDone: () => void }) => {
  const router = useRouter();
  const createSpace = useCreateSpace(slug);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SpaceValues>({ resolver: zodForm(spaceSchema) });

  const onSubmit = handleSubmit((values) =>
    createSpace.mutate(
      { key: values.key.toUpperCase(), name: values.name, description: values.description },
      {
        onSuccess: (space) => {
          toast.success("Space created");
          onDone();
          router.push(`/org/${slug}/spaces/${space.key}`);
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    ),
  );

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <div className="space-y-1">
        <label htmlFor="key" className="text-sm font-medium">
          Key
        </label>
        <Input id="key" placeholder="ENG" aria-invalid={Boolean(errors.key)} {...register("key")} />
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
  );
};

const CreateDashboardForm = ({ slug, onDone }: { slug: string; onDone: () => void }) => {
  const router = useRouter();
  const createDashboard = useCreateDashboard(slug);
  const [name, setName] = useState("");

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createDashboard.mutate(
      { name: trimmed, widgets: [] },
      {
        onSuccess: (d) => {
          onDone();
          router.push(`/org/${slug}/dashboards/${d.id}`);
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <NamedCreate
      label="Dashboard name"
      placeholder="My dashboard"
      name={name}
      setName={setName}
      pending={createDashboard.isPending}
      onSubmit={submit}
      cta="Create dashboard"
    />
  );
};

const CreateFilterForm = ({ slug, onDone }: { slug: string; onDone: () => void }) => {
  const router = useRouter();
  const createFilter = useCreateFilter(slug);
  const [name, setName] = useState("");

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createFilter.mutate(
      { name: trimmed, criteria: {} },
      {
        onSuccess: (f) => {
          onDone();
          router.push(`/org/${slug}/filters/${f.id}`);
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <NamedCreate
      label="Filter name"
      placeholder="My filter"
      name={name}
      setName={setName}
      pending={createFilter.isPending}
      onSubmit={submit}
      cta="Create filter"
    />
  );
};

/** Shared single-name create form for dashboards and filters. */
const NamedCreate = ({
  label,
  placeholder,
  name,
  setName,
  pending,
  onSubmit,
  cta,
}: {
  label: string;
  placeholder: string;
  name: string;
  setName: (v: string) => void;
  pending: boolean;
  onSubmit: () => void;
  cta: string;
}) => (
  <form
    className="space-y-4"
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
  >
    <div className="space-y-1">
      <label htmlFor="name" className="text-sm font-medium">
        {label}
      </label>
      <Input
        id="name"
        autoFocus
        placeholder={placeholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </div>
    <Button type="submit" className="w-full" disabled={!name.trim() || pending}>
      {pending ? "Creating…" : cta}
    </Button>
  </form>
);
