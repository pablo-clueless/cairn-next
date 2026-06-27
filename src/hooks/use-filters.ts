"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiQuery } from "@/lib/query";
import { http } from "@/lib/client";
import type { CreateFilterInput, FilterUpdate, HttpResponse, SavedFilter } from "@/types";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

const filtersUrl = (slug: string) => `/v1/orgs/${slug}/filters`;

/** A user's saved filters in an org (starred first). */
export const useFilters = (slug: string) =>
  useApiQuery<SavedFilter[]>({
    url: filtersUrl(slug),
    enabled: Boolean(slug),
    transform: data<SavedFilter[]>,
  });

export const useCreateFilter = (slug: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFilterInput) =>
      http.post<HttpResponse<SavedFilter>>(filtersUrl(slug), input).then((env) => env.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [filtersUrl(slug)] }),
  });
};

export const useUpdateFilter = (slug: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: FilterUpdate }) =>
      http
        .patch<HttpResponse<SavedFilter>>(`${filtersUrl(slug)}/${id}`, update)
        .then((env) => env.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [filtersUrl(slug)] }),
  });
};

export const useDeleteFilter = (slug: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.delete(`${filtersUrl(slug)}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [filtersUrl(slug)] }),
  });
};
