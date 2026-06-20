"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/client";
import { useMe } from "@/hooks/use-auth";
import {
  useInvitations,
  useInvite,
  useMembers,
  useOrg,
  useRemoveMember,
  useRevokeInvite,
  useUpdateMemberRole,
} from "@/hooks/use-orgs";
import { useSubscription, useUpdateSubscription } from "@/hooks/use-subscription";
import {
  SUPPORTED_CURRENCIES,
  formatMoney,
  type InvitableRole,
  type Role,
  type SubscriptionStatus,
} from "@/types";

const ROLES: Role[] = ["owner", "admin", "member", "guest"];
const INVITE_ROLES: InvitableRole[] = ["admin", "member", "guest"];
const STATUSES: SubscriptionStatus[] = ["inactive", "trialing", "active", "past_due", "canceled"];

const Page = () => {
  const { slug } = useParams<{ slug: string }>();
  const me = useMe();
  const isPlatformAdmin = Boolean(me.data?.is_platform_admin);

  const org = useOrg(slug);
  const isAdmin = org.data?.role === "owner" || org.data?.role === "admin";

  const members = useMembers(slug);
  const invitations = useInvitations(slug, isAdmin);
  const invite = useInvite(slug);
  const updateRole = useUpdateMemberRole(slug);
  const removeMember = useRemoveMember(slug);
  const revokeInvite = useRevokeInvite(slug);

  const subscription = useSubscription(slug);
  const updateSub = useUpdateSubscription(slug);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitableRole>("member");

  // Platform-admin subscription form, seeded from the subscription.
  const [form, setForm] = useState({
    billing_enabled: false,
    status: "inactive" as SubscriptionStatus,
    currency: "NGN",
    trial_days: 14,
    price_naira: 0,
  });
  useEffect(() => {
    const s = subscription.data;
    if (!s) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      billing_enabled: s.billing_enabled,
      status: s.status,
      currency: s.currency,
      trial_days: s.trial_days,
      price_naira: Math.round(s.price_per_seat_cents / 100),
    });
  }, [subscription.data]);

  const onInvite = (e: React.FormEvent) => {
    e.preventDefault();
    invite.mutate(
      { email, role },
      {
        onSuccess: () => {
          toast.success(`Invitation sent to ${email}`);
          setEmail("");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const onSaveSub = (e: React.FormEvent) => {
    e.preventDefault();
    updateSub.mutate(
      {
        billing_enabled: form.billing_enabled,
        status: form.status,
        currency: form.currency,
        trial_days: form.trial_days,
        price_per_seat_cents: Math.round(form.price_naira * 100),
      },
      {
        onSuccess: () => toast.success("Subscription updated"),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  if (org.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }
  if (org.isError || !org.data) {
    return <p className="text-muted-foreground">Organization not found.</p>;
  }

  const sub = subscription.data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">{org.data.name}</h1>
          <p className="text-muted-foreground text-sm">{org.data.slug}</p>
        </div>
        <span className="bg-muted rounded-full px-2.5 py-1 text-xs capitalize">
          {org.data.role}
        </span>
      </div>

      {/* Subscription */}
      <section className="space-y-3">
        <h2 className="font-medium">Subscription</h2>
        {sub ? (
          <div className="space-y-4 rounded-xs border p-4">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground text-xs">Status</p>
                <p className="capitalize">{sub.billing_enabled ? sub.status : "billing off"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Seats</p>
                <p>{sub.seats}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Per seat</p>
                <p>{formatMoney(sub.price_per_seat_cents, sub.currency)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Due / period</p>
                <p>{formatMoney(sub.amount_due_cents, sub.currency)}</p>
              </div>
            </div>
            {sub.status === "trialing" && (
              <p className="text-sm">
                {sub.trial_expired
                  ? "Trial has ended."
                  : `Free trial — ${sub.trial_days_remaining} day(s) remaining.`}
              </p>
            )}

            {isPlatformAdmin && (
              <form onSubmit={onSaveSub} className="space-y-3 border-t pt-4">
                <p className="text-muted-foreground text-xs">Platform admin controls</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.billing_enabled}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, billing_enabled: e.target.checked }))
                      }
                    />
                    Billing enabled
                  </label>
                  <label className="flex items-center justify-between gap-2 text-sm">
                    Status
                    <Select
                      value={form.status}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, status: v as SubscriptionStatus }))
                      }
                    >
                      <SelectTrigger className="w-40 capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((st) => (
                          <SelectItem key={st} value={st} className="capitalize">
                            {st}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="flex items-center justify-between gap-2 text-sm">
                    Currency
                    <Select
                      value={form.currency}
                      onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_CURRENCIES.map((cur) => (
                          <SelectItem key={cur.value} value={cur.value}>
                            {cur.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="flex items-center justify-between gap-2 text-sm">
                    Trial days
                    <Input
                      type="number"
                      min={0}
                      className="h-8 w-24"
                      value={form.trial_days}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, trial_days: Number(e.target.value) }))
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 text-sm">
                    Price / seat ({form.currency})
                    <Input
                      type="number"
                      min={0}
                      className="h-8 w-28"
                      value={form.price_naira}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, price_naira: Number(e.target.value) }))
                      }
                    />
                  </label>
                </div>
                <Button type="submit" disabled={updateSub.isPending}>
                  {updateSub.isPending ? "Saving…" : "Save subscription"}
                </Button>
              </form>
            )}
          </div>
        ) : (
          <div className="grid place-items-center rounded-xs border py-8">
            <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
          </div>
        )}
      </section>

      {/* Members */}
      <section className="space-y-3">
        <h2 className="font-medium">Members</h2>
        <div className="divide-y rounded-xs border">
          {members.isLoading ? (
            <div className="grid place-items-center py-8">
              <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
            </div>
          ) : (
            members.data?.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between gap-4 p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.name}</p>
                  <p className="text-muted-foreground truncate text-sm">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <Select
                      value={m.role}
                      disabled={updateRole.isPending}
                      onValueChange={(v) =>
                        updateRole.mutate(
                          { userId: m.user_id, role: v as Role },
                          { onError: (error) => toast.error(getApiErrorMessage(error)) },
                        )
                      }
                    >
                      <SelectTrigger className="w-32 capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="capitalize">
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-muted-foreground text-sm capitalize">{m.role}</span>
                  )}
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      disabled={removeMember.isPending}
                      onClick={() =>
                        removeMember.mutate(m.user_id, {
                          onSuccess: () => toast.success("Member removed"),
                          onError: (error) => toast.error(getApiErrorMessage(error)),
                        })
                      }
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Invitations (admins only) */}
      {isAdmin && (
        <section className="space-y-3">
          <h2 className="font-medium">Invite a member</h2>
          <form onSubmit={onInvite} className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              required
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="sm:flex-1"
            />
            <Select value={role} onValueChange={(v) => setRole(v as InvitableRole)}>
              <SelectTrigger className="capitalize sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVITE_ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={invite.isPending}>
              {invite.isPending ? "Sending…" : "Send invite"}
            </Button>
          </form>

          {invitations.data && invitations.data.length > 0 && (
            <div className="divide-y rounded-xs border">
              {invitations.data.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-4 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{inv.email}</p>
                    <p className="text-muted-foreground text-xs capitalize">{inv.role} · pending</p>
                  </div>
                  <Button
                    variant="ghost"
                    disabled={revokeInvite.isPending}
                    onClick={() =>
                      revokeInvite.mutate(inv.id, {
                        onSuccess: () => toast.success("Invitation revoked"),
                        onError: (error) => toast.error(getApiErrorMessage(error)),
                      })
                    }
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Page;
