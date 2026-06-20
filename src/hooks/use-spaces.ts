"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiMutation, useApiQuery } from "@/lib/query";
import { http } from "@/lib/client";
import type { CreateSpaceInput, HttpResponse, Space } from "@/types";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;
const spacesKey = (slug: string) => [`/v1/orgs/${slug}/spaces`];

export const useSpaces = (slug: string) =>
  useApiQuery<Space[]>({
    url: `/v1/orgs/${slug}/spaces`,
    enabled: Boolean(slug),
    transform: data<Space[]>,
  });

export const useSpace = (slug: string, spaceKey: string) =>
  useApiQuery<Space>({
    url: `/v1/orgs/${slug}/spaces/${spaceKey}`,
    enabled: Boolean(slug && spaceKey),
    transform: data<Space>,
  });

export const useCreateSpace = (slug: string) =>
  useApiMutation<Space, CreateSpaceInput>({
    method: "POST",
    url: `/v1/orgs/${slug}/spaces`,
    transform: data<Space>,
    invalidates: [spacesKey(slug)],
  });

export const useDeleteSpace = (slug: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (spaceKey: string) => http.delete(`/v1/orgs/${slug}/spaces/${spaceKey}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: spacesKey(slug) }),
  });
};
