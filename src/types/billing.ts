export type SubscriptionStatus = "inactive" | "trialing" | "active" | "past_due" | "canceled";

/** Currencies a tenant may bill in (mirrors billing.SupportedCurrencies on the API). */
export const SUPPORTED_CURRENCIES = [
  { label: "Nigerian Naira", value: "NGN" },
  { label: "US Dollar", value: "USD" },
  { label: "Euro", value: "EUR" },
  { label: "GB Pounds", value: "GBP" },
  { label: "Ghana Cedis", value: "GHS" },
  { label: "Kenyan Shillings", value: "KES" },
  { label: "ZA Rands", value: "ZAR" },
  { label: "Canadian Dollar", value: "CAD" },
  { label: "Australian Dollar", value: "AUD" },
];

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

/** Subscription view as returned by the API (model fields + derived fields). */
export interface Subscription {
  id: string;
  organization_id: string;
  organization_name: string;
  billing_enabled: boolean;
  status: SubscriptionStatus;
  plan: string;
  price_per_seat_cents: number;
  currency: string;
  trial_days: number;
  trial_ends_at?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  canceled_at?: string | null;
  created_at: string;
  updated_at: string;
  // Derived
  seats: number;
  amount_due_cents: number;
  trial_days_remaining: number;
  trial_expired: boolean;
}

export interface AppSettings {
  default_trial_days: number;
  updated_at: string;
}

/** Org + subscription pair returned by the platform-admin orgs list. */
export interface AdminOrgItem {
  organization: import("./org").Organization;
  subscription: Subscription;
}

/** Platform-admin patch for a subscription. */
export interface SubscriptionUpdate {
  billing_enabled?: boolean;
  status?: SubscriptionStatus;
  trial_days?: number;
  price_per_seat_cents?: number;
  currency?: string;
}

/** Formats integer cents in the given currency, e.g. 1500 + "NGN" -> ₦15.00. */
export function formatMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
