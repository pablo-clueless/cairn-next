"use client";

import { useMutation, useQueryClient, type Query, type QueryKey } from "@tanstack/react-query";

import { useApiQuery } from "@/lib/query";
import { http } from "@/lib/client";
import type {
  CreateStatusInput,
  HttpResponse,
  StatusPatch,
  StatusUpdate,
  WorkflowStatus,
} from "@/types";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

const statusesUrl = (slug: string, spaceKey: string) =>
  `/v1/orgs/${slug}/spaces/${spaceKey}/statuses`;
const statusesKey = (slug: string, spaceKey: string) => [statusesUrl(slug, spaceKey)];

// useApiQuery keys statuses as [url, JSON.stringify(params)], so optimistic
// setQueryData (which needs an exact key) must match by url prefix, not [url].
const statusesMatch = (slug: string, spaceKey: string) => (query: Query) =>
  query.queryKey[0] === statusesUrl(slug, spaceKey);

export const useStatuses = (slug: string, spaceKey: string) =>
  useApiQuery<WorkflowStatus[]>({
    url: `/v1/orgs/${slug}/spaces/${spaceKey}/statuses`,
    enabled: Boolean(slug && spaceKey),
    transform: data<WorkflowStatus[]>,
  });

export const useCreateStatus = (slug: string, spaceKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStatusInput) =>
      http
        .post<HttpResponse<WorkflowStatus>>(`/v1/orgs/${slug}/spaces/${spaceKey}/statuses`, input)
        .then((env) => env.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: statusesKey(slug, spaceKey) }),
  });
};

// Status update/delete address the status by id (org-scoped), not the space path.
export const useUpdateStatus = (slug: string, spaceKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: StatusUpdate }) =>
      http
        .patch<HttpResponse<WorkflowStatus>>(`/v1/orgs/${slug}/statuses/${id}`, update)
        .then((env) => env.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: statusesKey(slug, spaceKey) }),
  });
};

export const useDeleteStatus = (slug: string, spaceKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.delete(`/v1/orgs/${slug}/statuses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: statusesKey(slug, spaceKey) }),
  });
};

/**
 * Bulk-update statuses in one request — e.g. reordering board columns, which
 * changes the position of two or more statuses at once. Returns the full,
 * reordered list. Optimistically patches the cache so the board doesn't flash.
 */
export const useReorderStatuses = (slug: string, spaceKey: string) => {
  const qc = useQueryClient();
  const match = statusesMatch(slug, spaceKey);
  return useMutation({
    mutationFn: (statuses: StatusPatch[]) =>
      http
        .patch<HttpResponse<WorkflowStatus[]>>(statusesUrl(slug, spaceKey), { statuses })
        .then((env) => env.data),
    onMutate: async (patches) => {
      await qc.cancelQueries({ predicate: match });
      const snapshot = qc.getQueriesData({ predicate: match });
      const byId = new Map(patches.map((p) => [p.id, p]));
      qc.setQueriesData({ predicate: match }, (old: unknown) =>
        Array.isArray(old)
          ? (old as WorkflowStatus[])
              .map((s) => ({ ...s, ...byId.get(s.id) }))
              .sort((a, b) => a.position - b.position)
          : old,
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot?.forEach(([key, value]: [QueryKey, unknown]) => qc.setQueryData(key, value));
    },
    onSettled: () => qc.invalidateQueries({ predicate: match }),
  });
};
