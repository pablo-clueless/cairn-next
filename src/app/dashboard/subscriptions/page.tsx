"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock, CreditCard, Loader2Icon } from "lucide-react";

import { DataTable, Statistics } from "@/components/shared";
import { subscriptions } from "@/config/columns";
import { useAdminOrgs } from "@/hooks/use-subscription";

const Page = () => {
  const { data: items, isLoading, isError } = useAdminOrgs();

  const { subs, stats } = useMemo(() => {
    const list = items ?? [];
    const subs = list.map((i) => ({
      ...i.subscription,
      organization_name: i.organization.name,
    }));
    const by = (s: string) => subs.filter((x) => x.status === s).length;
    return {
      subs,
      stats: {
        total: subs.length,
        active: by("active"),
        trialing: by("trialing"),
        pastDue: by("past_due"),
      },
    };
  }, [items]);

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }
  if (isError) {
    return <p className="text-muted-foreground">Failed to load subscriptions.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Subscriptions</p>
          <p className="text-muted-foreground text-sm">Subscriptions across all organizations</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Statistics icon={CreditCard} title="Total" value={String(stats.total)} />
        <Statistics icon={CheckCircle2} title="Active" value={String(stats.active)} />
        <Statistics icon={Clock} title="On trial" value={String(stats.trialing)} />
        <Statistics
          icon={AlertTriangle}
          title="Past due"
          value={String(stats.pastDue)}
          trend={stats.pastDue > 0 ? "down" : undefined}
        />
      </div>
      <DataTable columns={subscriptions} data={subs} />
    </div>
  );
};

export default Page;
