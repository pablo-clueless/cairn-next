"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/client";
import { IssueFilterView } from "@/components/spaces/issue-filter-view";
import { useFilters, useUpdateFilter } from "@/hooks/use-filters";
import type { FilterCriteria, SavedFilter } from "@/types";

const Page = () => {
  const { slug, filterId } = useParams<{ slug: string; filterId: string }>();
  const filters = useFilters(slug);

  if (filters.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }
  const filter = filters.data?.find((f) => f.id === filterId);
  if (!filter) {
    return <p className="text-muted-foreground">Filter not found.</p>;
  }
  // Key by id so the editable state re-seeds when switching between filters.
  return <FilterDetail key={filter.id} slug={slug} filter={filter} />;
};

const FilterDetail = ({ slug, filter }: { slug: string; filter: SavedFilter }) => {
  const [criteria, setCriteria] = useState<FilterCriteria>(filter.criteria ?? {});
  const update = useUpdateFilter(slug);
  const dirty = JSON.stringify(criteria) !== JSON.stringify(filter.criteria ?? {});

  return (
    <div className="space-y-6">
      <Link
        href={`/org/${slug}/filters`}
        className="text-muted-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeftIcon className="size-3.5" /> Filters
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold">{filter.name}</h1>
        {dirty && (
          <Button
            disabled={update.isPending}
            onClick={() =>
              update.mutate(
                { id: filter.id, update: { criteria } },
                {
                  onSuccess: () => toast.success("Filter updated"),
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                },
              )
            }
          >
            Save changes
          </Button>
        )}
      </div>
      <IssueFilterView slug={slug} criteria={criteria} onChange={setCriteria} />
    </div>
  );
};

export default Page;
