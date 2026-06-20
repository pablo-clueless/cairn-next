"use client";

import { AlertTriangle, Building2, Clock, CreditCard, Loader2Icon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useMemo } from "react";

import { formatMoney, type SubscriptionStatus } from "@/types";
import { DataTable, Statistics } from "@/components/shared";
import { useAdminOrgs } from "@/hooks/use-subscription";
import { organizations } from "@/config/columns";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const STATUS_ORDER: SubscriptionStatus[] = [
  "active",
  "trialing",
  "past_due",
  "inactive",
  "canceled",
];
const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Past due",
  inactive: "Inactive",
  canceled: "Canceled",
};

const statusChartConfig = {
  count: { label: "Subscriptions", color: "var(--color-primary-500)" },
} satisfies ChartConfig;

const revenueChartConfig = {
  amount: { label: "MRR", color: "var(--color-secondary-500)" },
} satisfies ChartConfig;

const Page = () => {
  const { data: items, isLoading, isError } = useAdminOrgs();

  const stats = useMemo(() => {
    const list = items ?? [];
    const by = (s: SubscriptionStatus) => list.filter((i) => i.subscription.status === s).length;

    const statusData = STATUS_ORDER.map((s) => ({
      status: STATUS_LABELS[s],
      count: by(s),
    }));

    const revenueByCurrency = new Map<string, number>();
    for (const { subscription } of list) {
      if (!subscription.billing_enabled) continue;
      revenueByCurrency.set(
        subscription.currency,
        (revenueByCurrency.get(subscription.currency) ?? 0) + subscription.amount_due_cents,
      );
    }
    const revenueData = [...revenueByCurrency.entries()].map(([currency, cents]) => ({
      currency,
      amount: cents / 100,
      label: formatMoney(cents, currency),
    }));

    return {
      total: list.length,
      active: by("active"),
      trialing: by("trialing"),
      pastDue: by("past_due"),
      statusData,
      revenueData,
    };
  }, [items]);

  const orgs = useMemo(() => (items ?? []).map((i) => i.organization), [items]);

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
          <p className="font-medium">Overview</p>
          <p className="text-muted-foreground text-sm">
            Organizations and subscriptions across the platform
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Statistics icon={Building2} title="Organizations" value={String(stats.total)} />
        <Statistics icon={CreditCard} title="Active subscriptions" value={String(stats.active)} />
        <Statistics icon={Clock} title="On trial" value={String(stats.trialing)} />
        <Statistics
          icon={AlertTriangle}
          title="Past due"
          value={String(stats.pastDue)}
          trend={stats.pastDue > 0 ? "down" : undefined}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xs border p-4">
          <p className="text-sm font-medium">Subscriptions by status</p>
          <ChartContainer config={statusChartConfig} className="max-h-64 w-full">
            <BarChart accessibilityLayer data={stats.statusData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>
        <div className="space-y-3 rounded-xs border p-4">
          <p className="text-sm font-medium">Monthly revenue by currency</p>
          {stats.revenueData.length > 0 ? (
            <ChartContainer config={revenueChartConfig} className="max-h-64 w-full">
              <BarChart accessibilityLayer data={stats.revenueData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="currency" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(_, __, item) => item.payload.label as string}
                    />
                  }
                />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="text-muted-foreground grid h-64 place-items-center text-sm">
              No billing-enabled subscriptions yet.
            </div>
          )}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium">Organizations</p>
        <DataTable columns={organizations} data={orgs} />
      </div>
    </div>
  );
};

export default Page;
