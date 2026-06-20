"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  CalendarDays,
  ChartNoAxesGantt,
  ClipboardList,
  Columns3,
  FileText,
  Globe,
  List,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const TABS: { segment: string; label: string; icon: LucideIcon }[] = [
  { segment: "summary", label: "Summary", icon: Globe },
  { segment: "list", label: "List", icon: List },
  { segment: "board", label: "Board", icon: Columns3 },
  { segment: "backlog", label: "Backlog", icon: ListChecks },
  { segment: "calendar", label: "Calendar", icon: CalendarDays },
  { segment: "timeline", label: "Timeline", icon: ChartNoAxesGantt },
  { segment: "docs", label: "Docs", icon: FileText },
  { segment: "forms", label: "Forms", icon: ClipboardList },
];

/** Route-based tab nav for a space (each tab is its own URL). */
export function SpaceTabNav() {
  const { slug, spaceKey } = useParams<{ slug: string; spaceKey: string }>();
  const pathname = usePathname();
  const base = `/org/${slug}/spaces/${spaceKey}`;

  return (
    <div className="flex gap-1 overflow-x-auto border-b" role="tablist">
      {TABS.map(({ segment, label, icon: Icon }) => {
        const href = `${base}/${segment}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={segment}
            href={href}
            role="tab"
            aria-selected={active}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors",
              active
                ? "border-brand text-brand font-medium"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
