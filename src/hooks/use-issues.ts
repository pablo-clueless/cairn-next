"use client";

import { useMutation, useQueryClient, type Query, type QueryKey } from "@tanstack/react-query";

import { useApiQuery } from "@/lib/query";
import { http } from "@/lib/client";
import type { CreateIssueInput, HttpResponse, Issue, IssueUpdate } from "@/types";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

export interface IssueFilters {
  space?: string;
  assignee?: string; // "me" or a user id
  status?: string;
  sprint?: string; // a sprint id, or "backlog" for issues with no sprint
  parent?: string; // a parent issue id — returns that issue's children
}

function issuesUrl(slug: string, f: IssueFilters = {}) {
  const qs = new URLSearchParams();
  if (f.space) qs.set("space", f.space);
  if (f.assignee) qs.set("assignee", f.assignee);
  if (f.status) qs.set("status", f.status);
  if (f.sprint) qs.set("sprint", f.sprint);
  if (f.parent) qs.set("parent", f.parent);
  const q = qs.toString();
  return `/v1/orgs/${slug}/issues${q ? `?${q}` : ""}`;
}

// Issue list query keys embed their filters in the URL, so invalidation must
// match by prefix (predicate), not an exact key.
const issuesMatch = (slug: string) => (query: Query) => {
  const k = query.queryKey[0];
  return typeof k === "string" && k.startsWith(`/v1/orgs/${slug}/issues`);
};
const spacesMatch = (slug: string) => (query: Query) => {
  const k = query.queryKey[0];
  return typeof k === "string" && k.startsWith(`/v1/orgs/${slug}/spaces`);
};

export const useIssues = (slug: string, filters: IssueFilters = {}) =>
  useApiQuery<Issue[]>({
    url: issuesUrl(slug, filters),
    enabled: Boolean(slug),
    transform: data<Issue[]>,
  });

export const useIssue = (slug: string, issueKey: string) =>
  useApiQuery<Issue>({
    url: `/v1/orgs/${slug}/issues/${issueKey}`,
    enabled: Boolean(slug && issueKey),
    transform: data<Issue>,
  });

// Issues belonging to a single sprint. Pass "backlog" to get issues with no
// sprint. The query stays disabled until a sprint is selected.
export const useSprintIssues = (slug: string, sprintId: string | null | undefined) =>
  useApiQuery<Issue[]>({
    url: issuesUrl(slug, { sprint: sprintId ?? undefined }),
    enabled: Boolean(slug && sprintId),
    transform: data<Issue[]>,
  });

export const useCreateIssue = (slug: string, spaceKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIssueInput) =>
      http
        .post<HttpResponse<Issue>>(`/v1/orgs/${slug}/spaces/${spaceKey}/issues`, input)
        .then((env) => env.data),
    onSuccess: () => {
      qc.invalidateQueries({ predicate: issuesMatch(slug) });
      qc.invalidateQueries({ predicate: spacesMatch(slug) });
    },
  });
};

/**
 * Partial issue update with optimistic cache patching, so board drag-and-drop
 * and inline edits reflect immediately. Rolls back on error, then revalidates.
 */
export const useUpdateIssue = (slug: string) => {
  const qc = useQueryClient();
  const match = issuesMatch(slug);

  return useMutation({
    mutationFn: ({ key, update }: { key: string; update: IssueUpdate }) =>
      http
        .patch<HttpResponse<Issue>>(`/v1/orgs/${slug}/issues/${key}`, update)
        .then((env) => env.data),
    onMutate: async ({ key, update }) => {
      await qc.cancelQueries({ predicate: match });
      const snapshot = qc.getQueriesData({ predicate: match });
      qc.setQueriesData({ predicate: match }, (old: unknown) => {
        if (Array.isArray(old)) {
          return (old as Issue[]).map((i) => (i.key === key ? { ...i, ...update } : i));
        }
        if (old && typeof old === "object" && (old as Issue).key === key) {
          return { ...(old as Issue), ...update };
        }
        return old;
      });
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot?.forEach(([key, value]: [QueryKey, unknown]) => qc.setQueryData(key, value));
    },
    onSettled: () => qc.invalidateQueries({ predicate: match }),
  });
};

export const useDeleteIssue = (slug: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => http.delete(`/v1/orgs/${slug}/issues/${key}`),
    onSuccess: () => {
      qc.invalidateQueries({ predicate: issuesMatch(slug) });
      qc.invalidateQueries({ predicate: spacesMatch(slug) });
    },
  });
};
