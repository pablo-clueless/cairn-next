"use client";

import { useMutation, useQueryClient, type Query } from "@tanstack/react-query";

import { useApiQuery } from "@/lib/query";
import { http } from "@/lib/client";
import type { ActivityEvent, HttpResponse, Watcher } from "@/types";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

const watchersUrl = (slug: string, issueKey: string) =>
  `/v1/orgs/${slug}/issues/${issueKey}/watchers`;

const watchersMatch = (slug: string, issueKey: string) => (q: Query) =>
  q.queryKey[0] === watchersUrl(slug, issueKey);

/** Users watching an issue. */
export const useWatchers = (slug: string, issueKey: string) =>
  useApiQuery<Watcher[]>({
    url: watchersUrl(slug, issueKey),
    enabled: Boolean(slug && issueKey),
    transform: data<Watcher[]>,
  });

/** Subscribe the current user to an issue. */
export const useWatchIssue = (slug: string, issueKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => http.post(watchersUrl(slug, issueKey), {}),
    onSuccess: () => qc.invalidateQueries({ predicate: watchersMatch(slug, issueKey) }),
  });
};

/** Unsubscribe a user (defaults to self) from an issue. */
export const useUnwatchIssue = (slug: string, issueKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      http.delete(`${watchersUrl(slug, issueKey)}/${userId}`),
    onSuccess: () => qc.invalidateQueries({ predicate: watchersMatch(slug, issueKey) }),
  });
};

/** An issue's activity feed (audit events touching it, newest first). */
export const useActivity = (slug: string, issueKey: string) =>
  useApiQuery<ActivityEvent[]>({
    url: `/v1/orgs/${slug}/issues/${issueKey}/activity`,
    enabled: Boolean(slug && issueKey),
    transform: data<ActivityEvent[]>,
  });
