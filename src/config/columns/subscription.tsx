import { Copy, Hash, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { createColumns, BooleanCell, DateCell, NumberCell, StatusCell } from "./shared";
import type { StatusVariant } from "./shared";
import { formatMoney, type Subscription, type SubscriptionStatus } from "@/types";

const STATUS_CONFIG: Partial<Record<SubscriptionStatus, StatusVariant>> = {
  inactive: "default",
  trialing: "info",
  active: "success",
  past_due: "warning",
  canceled: "danger",
};

export const subscriptions = createColumns<Subscription>({
  columns: [
    {
      accessorKey: "organization_name",
      header: "Organization",
    },
    {
      accessorKey: "plan",
      header: "Plan",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusCell status={row.original.status} config={STATUS_CONFIG} />,
    },
    {
      accessorKey: "billing_enabled",
      header: "Billing",
      cell: ({ row }) => (
        <BooleanCell value={row.original.billing_enabled} labels={["On", "Off"]} />
      ),
    },
    {
      accessorKey: "seats",
      header: "Seats",
      cell: ({ row }) => <NumberCell value={row.original.seats} />,
    },
    {
      accessorKey: "price_per_seat_cents",
      header: "Per seat",
      cell: ({ row }) => (
        <span>{formatMoney(row.original.price_per_seat_cents, row.original.currency)}</span>
      ),
    },
    {
      accessorKey: "amount_due_cents",
      header: "Due / period",
      cell: ({ row }) => (
        <span>{formatMoney(row.original.amount_due_cents, row.original.currency)}</span>
      ),
    },
    {
      accessorKey: "current_period_end",
      header: "Renews",
      cell: ({ row }) => <DateCell date={row.original.current_period_end ?? null} />,
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => <DateCell date={row.original.created_at} />,
    },
  ],
  actions: (sub) => [
    {
      label: "Manage",
      icon: Settings2,
      href: `/dashboard/organizations/${sub.organization_id}`,
    },
    {
      label: "Copy subscription ID",
      icon: Hash,
      onClick: () => {
        navigator.clipboard.writeText(sub.id);
        toast.success("Subscription ID copied");
      },
    },
    {
      label: "Copy organization ID",
      icon: Copy,
      onClick: () => {
        navigator.clipboard.writeText(sub.organization_id);
        toast.success("Organization ID copied");
      },
    },
  ],
});
