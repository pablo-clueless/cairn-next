"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboardIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/client";
import { useCreateDashboard, useDashboards, useDeleteDashboard } from "@/hooks/use-dashboards";

const Page = () => {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [name, setName] = useState("");

  const dashboards = useDashboards(slug);
  const createDashboard = useCreateDashboard(slug);
  const deleteDashboard = useDeleteDashboard(slug);

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createDashboard.mutate(
      { name: trimmed, widgets: [] },
      {
        onSuccess: (d) => {
          setName("");
          router.push(`/org/${slug}/dashboards/${d.id}`);
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const list = dashboards.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold">Dashboards</h1>
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New dashboard name…"
            className="w-56"
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
          <Button disabled={!name.trim() || createDashboard.isPending} onClick={create}>
            Create
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-muted-foreground text-sm">No dashboards yet. Create one to get started.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => (
            <div key={d.id} className="hover:bg-accent/40 group rounded-md border p-4 transition-colors">
              <div className="flex items-start justify-between">
                <Link href={`/org/${slug}/dashboards/${d.id}`} className="flex items-center gap-2">
                  <LayoutDashboardIcon className="text-muted-foreground size-4" />
                  <span className="font-medium">{d.name}</span>
                </Link>
                <button
                  aria-label="Delete dashboard"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    deleteDashboard.mutate(d.id, {
                      onError: (error) => toast.error(getApiErrorMessage(error)),
                    })
                  }
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {d.widgets.length} widget{d.widgets.length === 1 ? "" : "s"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Page;
