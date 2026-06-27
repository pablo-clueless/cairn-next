import type { LucideIcon } from "lucide-react";
import {
  Clock,
  CreditCard,
  Kanban,
  LayoutDashboard,
  ListFilter,
  NotebookTabs,
  Settings,
  Star,
  User,
} from "lucide-react";

export interface RouteItem {
  id: string;
  name: string;
}

export interface RouteConfig {
  label: string;
  segment: string;
  icon: LucideIcon;
  /**
   * Builds the org-scoped endpoint that returns this route's children. Children
   * are created at runtime, so they're fetched on demand (when the group is
   * expanded). Presence of this field marks the route as a collapsible group.
   */
  childrenSource?: (slug: string) => string;
}

export const USER_ROUTES: RouteConfig[] = [
  { label: "For you", segment: "for-you", icon: User },
  { label: "Recent", segment: "recent", icon: Clock },
  { label: "Starred", segment: "starred", icon: Star },
  {
    label: "Spaces",
    segment: "spaces",
    icon: Kanban,
    childrenSource: (s) => `/v1/orgs/${s}/spaces`,
  },
  {
    label: "Dashboards",
    segment: "dashboards",
    icon: LayoutDashboard,
    childrenSource: (s) => `/v1/orgs/${s}/dashboards`,
  },
  {
    label: "Filters",
    segment: "filters",
    icon: ListFilter,
    childrenSource: (s) => `/v1/orgs/${s}/filters`,
  },
];

export const PLATFORM_ROUTES: RouteConfig[] = [
  { label: "Dashboard", segment: "/", icon: LayoutDashboard },
  { label: "Organizations", segment: "organizations", icon: NotebookTabs },
  { label: "Subscriptions", segment: "subscriptions", icon: CreditCard },
  { label: "Settings", segment: "settings", icon: Settings },
];
