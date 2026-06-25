"use client";

import { Bell, Loader2Icon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { formatRelativeTime } from "@/lib/string";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationCount,
  useNotifications,
} from "@/hooks/use-notifications";
import type { Notification } from "@/types";

export const Notifications = () => {
  const [open, setOpen] = useState(false);
  const notifications = useNotifications();
  const count = useNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const list = notifications.data ?? [];
  const unread = count.data?.unread ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="outline" className="relative">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="bg-brand text-background absolute -top-1 -right-1 grid size-4 place-items-center rounded-full text-[9px] font-medium">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-0 p-3">
        <div className="flex w-full items-center justify-between">
          <p className="text-sm font-medium">Notifications</p>
          <Button
            size="xs"
            variant="ghost"
            disabled={unread === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            Mark all read
          </Button>
        </div>
        <div className="mt-2 max-h-96 space-y-1 overflow-y-auto border-t pt-2">
          {notifications.isLoading ? (
            <div className="grid place-items-center py-6">
              <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              You&apos;re all caught up.
            </p>
          ) : (
            list.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onClick={() => {
                  if (!n.read_at) markRead.mutate(n.id);
                  setOpen(false);
                }}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const NotificationRow = ({
  notification: n,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) => {
  const href = n.issue_key
    ? `/org/${n.org_slug}/issues/${n.issue_key}`
    : `/org/${n.org_slug}/for-you`;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "hover:bg-accent block rounded-md px-2 py-2 text-sm transition-colors",
        !n.read_at && "bg-accent/40",
      )}
    >
      <div className="flex items-start gap-2">
        {!n.read_at && <span className="bg-brand mt-1.5 size-1.5 shrink-0 rounded-full" />}
        <div className={cn("min-w-0 flex-1", n.read_at && "pl-3.5")}>
          <p className="truncate font-medium">{n.title}</p>
          {n.body && <p className="text-muted-foreground truncate text-xs">{n.body}</p>}
          <p className="text-muted-foreground mt-0.5 text-[11px]">
            {formatRelativeTime(n.created_at)}
          </p>
        </div>
      </div>
    </Link>
  );
};
