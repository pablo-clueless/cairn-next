"use client";

import { useMutation, useQueryClient, type Query } from "@tanstack/react-query";

import { useApiQuery } from "@/lib/query";
import { http } from "@/lib/client";
import type {
  HttpResponse,
  Notification,
  NotificationPreferences,
  NotificationPreferencesUpdate,
} from "@/types";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

const LIST_URL = "/v1/notifications";
const COUNT_URL = "/v1/notifications/count";
const PREFS_URL = "/v1/notifications/preferences";

// The list lives under two URL keys (all / unread-only); match either by prefix.
const listMatch = (q: Query) =>
  typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith(LIST_URL);

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ predicate: listMatch });
  qc.invalidateQueries({ queryKey: [COUNT_URL] });
};

/** The current user's inbox, newest first. Pass unreadOnly to filter. */
export const useNotifications = (unreadOnly = false) =>
  useApiQuery<Notification[]>({
    url: unreadOnly ? `${LIST_URL}?unread=true` : LIST_URL,
    transform: data<Notification[]>,
  });

/** Unread count for the bell badge. */
export const useNotificationCount = () =>
  useApiQuery<{ unread: number }>({
    url: COUNT_URL,
    transform: data<{ unread: number }>,
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.patch(`${LIST_URL}/${id}`, { read: true }),
    onSuccess: () => invalidate(qc),
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => http.patch(LIST_URL, { read: true }),
    onSuccess: () => invalidate(qc),
  });
};

export const useNotificationPreferences = () =>
  useApiQuery<NotificationPreferences>({
    url: PREFS_URL,
    transform: data<NotificationPreferences>,
  });

export const useUpdateNotificationPreferences = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (update: NotificationPreferencesUpdate) =>
      http.patch<HttpResponse<NotificationPreferences>>(PREFS_URL, update).then((env) => env.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PREFS_URL] }),
  });
};
