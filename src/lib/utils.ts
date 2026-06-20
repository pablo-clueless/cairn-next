import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalize(href: string) {
  if (!href) return "";
  const cleanedHref = href.replace(/[?#].+$/, "");
  if (cleanedHref.length <= 3) return cleanedHref;
  const [a, b] = cleanedHref.replace(/\//, "").split("/").filter(Boolean);
  return b ? `/${a}/${b}` : `/${a}`;
}

export function removeNullOrUndefined<T extends object>(values: T): T {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== null && value !== undefined),
  ) as T;
}

export function formatCurrency(
  amount = 0,
  currency = "NGN",
  display: "compact" | "full" = "compact",
) {
  return new Intl.NumberFormat("en-NG", {
    currency,
    currencyDisplay: "narrowSymbol",
    style: "currency",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    ...(display === "compact"
      ? { notation: "compact", compactDisplay: "short" }
      : { notation: "standard" }),
  }).format(amount);
}
