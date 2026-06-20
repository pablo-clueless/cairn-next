"use client";

import { useMutation, useQueryClient, type Query } from "@tanstack/react-query";

import { useApiMutation, useApiQuery } from "@/lib/query";
import { http } from "@/lib/client";
import type { CreateSprintInput, HttpResponse, Sprint, SprintUpdate } from "@/types";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

const sprintsKey = (slug: string, spaceKey: string) => [
  `/v1/orgs/${slug}/spaces/${spaceKey}/sprints`,
];

// Completing a sprint moves issues around, so refresh issue lists too.
const issuesMatch = (slug: string) => (q: Query) =>
  typeof q.queryKey[0] === "string" &&
  (q.queryKey[0] as string).startsWith(`/v1/orgs/${slug}/issues`);

export const useSprints = (slug: string, spaceKey: string) =>
  useApiQuery<Sprint[]>({
    url: `/v1/orgs/${slug}/spaces/${spaceKey}/sprints`,
    enabled: Boolean(slug && spaceKey),
    transform: data<Sprint[]>,
  });

export const useCreateSprint = (slug: string, spaceKey: string) =>
  useApiMutation<Sprint, CreateSprintInput>({
    method: "POST",
    url: `/v1/orgs/${slug}/spaces/${spaceKey}/sprints`,
    transform: data<Sprint>,
    invalidates: [sprintsKey(slug, spaceKey)],
  });

export const useUpdateSprint = (slug: string, spaceKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: SprintUpdate }) =>
      http
        .patch<HttpResponse<Sprint>>(`/v1/orgs/${slug}/sprints/${id}`, update)
        .then((e) => e.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintsKey(slug, spaceKey) });
      qc.invalidateQueries({ predicate: issuesMatch(slug) });
    },
  });
};

export const useDeleteSprint = (slug: string, spaceKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.delete(`/v1/orgs/${slug}/sprints/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintsKey(slug, spaceKey) });
      qc.invalidateQueries({ predicate: issuesMatch(slug) });
    },
  });
};
