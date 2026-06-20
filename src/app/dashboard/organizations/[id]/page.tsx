"use client";

import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import Link from "next/link";
import z from "zod";

import { SUPPORTED_CURRENCIES, formatMoney, type SubscriptionStatus } from "@/types";
import { useAdminOrg, useUpdateSubscription } from "@/hooks/use-subscription";
import { getApiErrorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/form";
import { FormField } from "@/types";

const STATUSES: { label: string; value: SubscriptionStatus }[] = [
  { label: "Inactive", value: "inactive" },
  { label: "Trialing", value: "trialing" },
  { label: "Active", value: "active" },
  { label: "Past Due", value: "past_due" },
  { label: "Canceled", value: "canceled" },
];

const statuses = z.enum(STATUSES.map((s) => s.value));

const schema = z.object({
  billing_enabled: z.boolean(),
  status: statuses,
  currency: z.string(),
  trial_days: z.number().min(0),
  price_per_seat_cents: z.number().min(0),
});

type FormValues = z.Infer<typeof schema>;

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-xs border p-4">
    <p className="text-muted-foreground text-xs">{label}</p>
    <p className="font-heading text-xl font-semibold">{value}</p>
  </div>
);

const Page = () => {
  const id = useParams().id as string;
  const { data, isLoading, isError } = useAdminOrg(id);
  const updateSub = useUpdateSubscription(id);

  const defaultValues = useMemo<FormValues>(() => {
    const price_per_seat_cents = data?.subscription.price_per_seat_cents || 0;
    return {
      billing_enabled: data?.subscription.billing_enabled || false,
      status: data?.subscription.status || "inactive",
      currency: data?.subscription.currency || "NGN",
      trial_days: data?.subscription.trial_days || 0,
      price_per_seat_cents: Math.round(price_per_seat_cents / 100),
    };
  }, [data]);

  const fields: Record<keyof FormValues, FormField<FormValues>> = {
    billing_enabled: { label: "Billing enabled", type: "toggle" },
    status: { label: "Status", type: "select", options: STATUSES },
    currency: { label: "Currency", type: "select", options: SUPPORTED_CURRENCIES },
    trial_days: { label: "Trial days", type: "number" },
    price_per_seat_cents: { label: "Price per seat", type: "number" },
  };

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }
  if (isError || !data) {
    return <p className="text-muted-foreground">Organization not found.</p>;
  }

  const { organization: org, subscription: sub } = data;

  const handleSubmit = (values: FormValues) => {
    updateSub.mutate(
      {
        billing_enabled: values.billing_enabled,
        status: values.status,
        currency: values.currency,
        trial_days: values.trial_days,
        price_per_seat_cents: Math.round(values.price_per_seat_cents * 100),
      },
      {
        onSuccess: () => toast.success("Subscription updated"),
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/organizations"
        className="text-muted-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeftIcon className="size-3.5" /> Organizations
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">{org.name}</h1>
          <p className="text-muted-foreground text-sm">{org.slug}</p>
        </div>
        <span className="bg-muted rounded-full px-2.5 py-1 text-xs capitalize">
          {sub ? (sub.billing_enabled ? sub.status : "billing off") : "—"}
        </span>
      </div>
      {sub && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Seats" value={sub.seats} />
            <Stat label="Per seat" value={formatMoney(sub.price_per_seat_cents, sub.currency)} />
            <Stat label="Due / period" value={formatMoney(sub.amount_due_cents, sub.currency)} />
            <Stat
              label="Trial"
              value={
                sub.status === "trialing"
                  ? sub.trial_expired
                    ? "Expired"
                    : `${sub.trial_days_remaining}d left`
                  : "—"
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="">
              <Form
                defaultValues={defaultValues}
                fields={fields}
                schema={schema}
                onSubmit={handleSubmit}
              >
                {({ field, form }) => (
                  <div className="space-y-6 border p-4">
                    <p className="font-medium">Subscription</p>
                    <div className="space-y-4">
                      {field("billing_enabled")}
                      {field("status")}
                      {field("currency")}
                      {field("trial_days")}
                      {field("price_per_seat_cents")}
                    </div>
                    <Button type="submit" disabled={updateSub.isPending || !form.formState.isDirty}>
                      {updateSub.isPending ? "Saving…" : "Save subscription"}
                    </Button>
                  </div>
                )}
              </Form>
            </div>
            <div className=""></div>
          </div>
        </>
      )}
    </div>
  );
};

export default Page;
