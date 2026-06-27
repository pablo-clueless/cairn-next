"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/client";
import { DashboardWidget } from "@/components/dashboards/dashboard-widget";
import { useDashboards, useUpdateDashboard } from "@/hooks/use-dashboards";
import { useSpaces } from "@/hooks/use-spaces";
import type { Dashboard, Widget, WidgetType } from "@/types";

const WIDGET_LABELS: Record<WidgetType, string> = {
  assigned_to_me: "Assigned to me",
  status_breakdown: "Status breakdown",
  sprint_progress: "Sprint progress",
};

const SCOPED: WidgetType[] = ["status_breakdown", "sprint_progress"];
const ADD = "__add__";
const NO_SPACE = "__none__";

const Page = () => {
  const { slug, dashboardId } = useParams<{ slug: string; dashboardId: string }>();
  const dashboards = useDashboards(slug);

  if (dashboards.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }
  const dashboard = dashboards.data?.find((d) => d.id === dashboardId);
  if (!dashboard) return <p className="text-muted-foreground">Dashboard not found.</p>;
  return <DashboardDetail key={dashboard.id} slug={slug} dashboard={dashboard} />;
};

const DashboardDetail = ({ slug, dashboard }: { slug: string; dashboard: Dashboard }) => {
  const [widgets, setWidgets] = useState<Widget[]>(dashboard.widgets ?? []);
  const [name, setName] = useState(dashboard.name);
  const update = useUpdateDashboard(slug);
  const spaces = useSpaces(slug);

  const persist = (next: Widget[]) => {
    setWidgets(next);
    update.mutate(
      { id: dashboard.id, update: { widgets: next } },
      { onError: (error) => toast.error(getApiErrorMessage(error)) },
    );
  };

  const addWidget = (type: WidgetType) =>
    persist([...widgets, { id: crypto.randomUUID(), type }]);
  const removeWidget = (id: string) => persist(widgets.filter((w) => w.id !== id));
  const setWidgetSpace = (id: string, space: string | undefined) =>
    persist(widgets.map((w) => (w.id === id ? { ...w, space } : w)));

  const renameOnBlur = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === dashboard.name) {
      setName(dashboard.name);
      return;
    }
    update.mutate(
      { id: dashboard.id, update: { name: trimmed } },
      { onError: (error) => toast.error(getApiErrorMessage(error)) },
    );
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/org/${slug}/dashboards`}
        className="text-muted-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeftIcon className="size-3.5" /> Dashboards
      </Link>

      <div className="flex items-center justify-between gap-4">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={renameOnBlur}
          className="h-9 max-w-sm border-transparent text-lg font-semibold hover:border-input focus:border-input"
        />
        <Select value={ADD} onValueChange={(v) => v !== ADD && addWidget(v as WidgetType)}>
          <SelectTrigger className="w-44">
            <PlusIcon className="size-3.5" />
            <SelectValue placeholder="Add widget" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ADD} disabled>
              Add widget…
            </SelectItem>
            {(Object.keys(WIDGET_LABELS) as WidgetType[]).map((t) => (
              <SelectItem key={t} value={t}>
                {WIDGET_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {widgets.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          This dashboard is empty. Add a widget to get started.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {widgets.map((w) => (
            <div key={w.id} className="space-y-3 rounded-md border p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">{w.title ?? WIDGET_LABELS[w.type]}</h3>
                <div className="flex items-center gap-1.5">
                  {SCOPED.includes(w.type) && (
                    <Select
                      value={w.space ?? NO_SPACE}
                      onValueChange={(v) => setWidgetSpace(w.id, v === NO_SPACE ? undefined : v)}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue placeholder="Space" />
                      </SelectTrigger>
                      <SelectContent>
                        {w.type === "status_breakdown" && (
                          <SelectItem value={NO_SPACE}>All spaces</SelectItem>
                        )}
                        {(spaces.data ?? []).map((sp) => (
                          <SelectItem key={sp.id} value={sp.key}>
                            {sp.key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <button
                    aria-label="Remove widget"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeWidget(w.id)}
                  >
                    <XIcon className="size-3.5" />
                  </button>
                </div>
              </div>
              <DashboardWidget slug={slug} widget={w} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Page;
