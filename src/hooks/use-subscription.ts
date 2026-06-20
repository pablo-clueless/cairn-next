"use client";

import { useApiMutation, useApiQuery } from "@/lib/query";
import type {
  AdminOrgItem,
  AppSettings,
  HttpResponse,
  Subscription,
  SubscriptionUpdate,
} from "@/types";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

/** Platform-admin: all organizations with their subscriptions. */
export const useAdminOrgs = (enabled = true) =>
  useApiQuery<AdminOrgItem[]>({ url: "/v1/admin/orgs", enabled, transform: data<AdminOrgItem[]> });

/** Platform-admin: a single organization with its subscription. */
export const useAdminOrg = (orgId: string) =>
  useApiQuery<AdminOrgItem>({
    url: `/v1/admin/orgs/${orgId}`,
    enabled: Boolean(orgId),
    transform: data<AdminOrgItem>,
  });

/** An org's subscription (any member). */
export const useSubscription = (orgId: string) =>
  useApiQuery<Subscription>({
    url: `/v1/orgs/${orgId}/subscription`,
    enabled: Boolean(orgId),
    transform: data<Subscription>,
  });

/** Platform-admin: update an org's subscription (billing, trial, price, currency). */
export const useUpdateSubscription = (orgId: string) =>
  useApiMutation<Subscription, SubscriptionUpdate>({
    method: "PATCH",
    url: `/v1/admin/orgs/${orgId}/subscription`,
    transform: data<Subscription>,
    invalidates: [
      [`/v1/orgs/${orgId}/subscription`],
      [`/v1/admin/orgs/${orgId}`],
      ["/v1/admin/orgs"],
    ],
  });

/** Platform-admin: global settings (default trial days). */
export const useSettings = (enabled = true) =>
  useApiQuery<AppSettings>({ url: "/v1/admin/settings", enabled, transform: data<AppSettings> });

export const useUpdateSettings = () =>
  useApiMutation<AppSettings, { default_trial_days: number }>({
    method: "PATCH",
    url: "/v1/admin/settings",
    transform: data<AppSettings>,
    invalidates: [["/v1/admin/settings"]],
  });
