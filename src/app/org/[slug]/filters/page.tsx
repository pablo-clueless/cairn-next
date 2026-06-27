"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StarIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/client";
import { IssueFilterView } from "@/components/spaces/issue-filter-view";
import { useCreateFilter, useDeleteFilter, useFilters, useUpdateFilter } from "@/hooks/use-filters";
import type { FilterCriteria } from "@/types";

const Page = () => {
  const { slug } = useParams<{ slug: string }>();
  const [criteria, setCriteria] = useState<FilterCriteria>({});
  const [name, setName] = useState("");

  const filters = useFilters(slug);
  const createFilter = useCreateFilter(slug);
  const updateFilter = useUpdateFilter(slug);
  const deleteFilter = useDeleteFilter(slug);

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createFilter.mutate(
      { name: trimmed, criteria },
      {
        onSuccess: () => {
          setName("");
          toast.success("Filter saved");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold">Filters</h1>
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this filter…"
            className="w-52"
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <Button disabled={!name.trim() || createFilter.isPending} onClick={save}>
            Save filter
          </Button>
        </div>
      </div>

      {(filters.data?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.data!.map((f) => (
            <div
              key={f.id}
              className="group flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
            >
              <button
                aria-label={f.is_starred ? "Unstar" : "Star"}
                onClick={() =>
                  updateFilter.mutate({ id: f.id, update: { is_starred: !f.is_starred } })
                }
              >
                <StarIcon
                  className={cn(
                    "size-3.5",
                    f.is_starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                  )}
                />
              </button>
              <Link href={`/org/${slug}/filters/${f.id}`} className="hover:underline">
                {f.name}
              </Link>
              <button
                aria-label="Delete filter"
                className="text-muted-foreground hover:text-destructive"
                onClick={() =>
                  deleteFilter.mutate(f.id, {
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  })
                }
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <IssueFilterView slug={slug} criteria={criteria} onChange={setCriteria} />
    </div>
  );
};

export default Page;
