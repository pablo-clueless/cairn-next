"use client";

import { Loader2Icon, Users } from "lucide-react";

import { organizations } from "@/config/columns/organiztion";
import { DataTable, Statistics } from "@/components/shared";
import { useAdminOrgs } from "@/hooks/use-subscription";
import { useMemo } from "react";

const Page = () => {
  const { data: items, isLoading, isError } = useAdminOrgs();

  const { orgs, stats } = useMemo(() => {
    const list = items ?? [];
    const orgs = list.map((item) => item.organization);
    const by = (s: string) => orgs.filter((x) => x.status === s).length;
    return {
      orgs,
      stats: {
        total: orgs.length,
        active: by("active"),
        inactive: by("inactive"),
        suspended: by("past_due"),
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
    return <p className="text-muted-foreground">Failed to load platform data.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Organizations</p>
          <p className="text-muted-foreground text-sm">Manage your organizations</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <Statistics icon={Users} title="Total Organizations" value={stats.total} />
        <Statistics icon={Users} title="Active Organizations" value={stats.active} />
        <Statistics icon={Users} title="Inactive Organizations" value={stats.inactive} />
        <Statistics icon={Users} title="Suspended Organizations" value={stats.suspended} />
      </div>
      <DataTable columns={organizations} data={orgs} />
    </div>
  );
};

export default Page;
