"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname, useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { USER_ROUTES, PLATFORM_ROUTES, type RouteItem, type RouteConfig } from "@/config/routes";
import { useAppContext } from "../providers";
import type { HttpResponse } from "@/types";
import { useApiQuery } from "@/lib/query";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { Create } from "../spaces/create";

/** Hook: the active org slug from the route. */
const useSlug = () => useParams<{ slug: string }>().slug;
const SIDEBAR_WIDTH = { collapsed: 64, expanded: 256 } as const;

/** Classes applied to the currently-active nav entry. */
const ACTIVE_CLASS = "bg-brand-light text-brand";

/**
 * Hook: is `href` the active route? Matches the current path exactly, or as an
 * ancestor of it (so a section stays lit on its detail pages). Index routes
 * (segment "/") match only exactly so they don't claim every sibling page.
 */
const useRouteActive = (href: string) => {
  const pathname = usePathname();
  const target = href.replace(/\/+$/, "") || "/";
  if (target === "/dashboard" || target === "/") return pathname === target;
  return pathname === target || pathname.startsWith(`${target}/`);
};

/** Label that fades and collapses its width in step with the sidebar. */
const NavLabel = ({ children }: { children: ReactNode }) => (
  <motion.span
    animate={{ opacity: 1, width: "auto" }}
    className="overflow-hidden whitespace-nowrap"
    exit={{ opacity: 0, width: 0 }}
    initial={{ opacity: 0, width: 0 }}
    transition={{ duration: 0.15 }}
  >
    {children}
  </motion.span>
);

/** A leaf route — no children. */
const NavItem = ({ inPlatform, route }: { inPlatform: boolean; route: RouteConfig }) => {
  const { isCollapsed } = useAppContext();
  const slug = useSlug();
  const { icon: Icon, label } = route;
  const href = inPlatform ? `/dashboard/${route.segment}` : `/org/${slug}/${route.segment}`;
  const isActive = useRouteActive(href);

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "hover:bg-muted flex items-center gap-x-2 rounded-xs text-sm font-medium transition-colors",
        isCollapsed ? "justify-center py-2" : "justify-start px-3 py-2",
        isActive && ACTIVE_CLASS,
      )}
      href={href}
      title={isCollapsed ? label : undefined}
    >
      <Icon className="size-4 shrink-0" />
      <AnimatePresence initial={false}>
        {!isCollapsed && <NavLabel>{label}</NavLabel>}
      </AnimatePresence>
    </Link>
  );
};

/** An expandable route whose children are fetched on demand. */
const NavGroup = ({ route }: { route: RouteConfig }) => {
  const { isCollapsed } = useAppContext();
  const [open, setOpen] = useState(false);
  const { icon: Icon, label } = route;
  const slug = useSlug();

  const href = `/org/${slug}/${route.segment}`;
  const pathname = usePathname();
  const isActive = useRouteActive(href);
  const expanded = open && !isCollapsed;

  // Fetch the group's children (e.g. spaces) on demand, once expanded. The
  // child id is the routing segment — spaces route by key, so map key -> id.
  const childrenUrl = route.childrenSource && slug ? route.childrenSource(slug) : "";
  const { data, isLoading } = useApiQuery<RouteItem[]>({
    url: childrenUrl,
    enabled: expanded && Boolean(childrenUrl),
    transform: (raw) =>
      ((raw as HttpResponse<Array<{ id?: string; key?: string; name: string }>>).data ?? []).map(
        (x) => ({ id: x.key ?? x.id ?? "", name: x.name }),
      ),
  });
  const children = data ?? [];

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "hover:bg-muted flex w-full items-center rounded-xs text-sm font-medium transition-colors",
          isCollapsed ? "justify-center py-2" : "justify-between px-3 py-2",
          isActive && ACTIVE_CLASS,
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        <button
          className={cn("flex items-center gap-x-2", !isCollapsed && "flex-1")}
          title={isCollapsed ? label : undefined}
        >
          <Icon className="size-4 shrink-0" />
          <AnimatePresence initial={false}>
            {!isCollapsed && <NavLabel>{label}</NavLabel>}
          </AnimatePresence>
        </button>
        <div className="flex items-center gap-x-2">
          {!isCollapsed && (
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              className="block"
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="size-4" />
            </motion.span>
          )}
          <Create segment={route.segment} slug={slug} />
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            key="children"
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="mt-1 ml-4 flex flex-col gap-y-1 border-l pl-3">
              {isLoading && (
                <span className="text-muted-foreground px-2 py-1 text-xs">Loading…</span>
              )}
              {!isLoading && children.length === 0 && (
                <span className="text-muted-foreground px-2 py-1 text-xs">
                  No {label.toLowerCase()} yet
                </span>
              )}
              {children.map((child) => {
                const childHref = `${href}/${child.id}`;
                const childActive = pathname === childHref;
                return (
                  <Link
                    aria-current={childActive ? "page" : undefined}
                    className={cn(
                      "hover:bg-muted text-muted-foreground hover:text-foreground truncate rounded-xs px-2 py-1 text-sm transition-colors",
                      childActive && `${ACTIVE_CLASS} font-medium`,
                    )}
                    href={childHref}
                    key={child.id}
                  >
                    {child.name}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Sidebar = () => {
  const { isCollapsed } = useAppContext();
  const pathname = usePathname();

  // The sidebar follows the area you're in, not who you are: the platform
  // (`/dashboard`) and the org workspace (`/org/[slug]`) each render their own
  // routes. A platform admin who is also an org member sees the workspace nav
  // while inside an org, and the admin nav only in the admin console.
  const inPlatform = pathname.startsWith("/dashboard");
  const ROUTES = useMemo(() => {
    return inPlatform ? PLATFORM_ROUTES : USER_ROUTES;
  }, [inPlatform]);

  return (
    <motion.aside
      animate={{ width: isCollapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded }}
      className="h-full shrink-0 overflow-hidden border-r"
      initial={false}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
    >
      <div className="flex h-14 items-center justify-between gap-x-2 border-b px-4">
        <Logo className="w-6 shrink-0" />
      </div>
      <div className="flex h-[calc(100%-56px)] w-full flex-col justify-between p-4">
        <div className="flex w-full flex-col gap-y-1">
          {ROUTES.map((route) =>
            route.childrenSource ? (
              <NavGroup key={route.segment} route={route} />
            ) : (
              <NavItem inPlatform={inPlatform} key={route.segment} route={route} />
            ),
          )}
        </div>
      </div>
    </motion.aside>
  );
};
