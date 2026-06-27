"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiQuery } from "@/lib/query";
import { http } from "@/lib/client";
import type {
  CreateDashboardInput,
  Dashboard,
  DashboardUpdate,
  HttpResponse,
} from "@/types";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

const dashboardsUrl = (slug: string) => `/v1/orgs/${slug}/dashboards`;

/** A user's dashboards in an org. */
export const useDashboards = (slug: string) =>
  useApiQuery<Dashboard[]>({
    url: dashboardsUrl(slug),
    enabled: Boolean(slug),
    transform: data<Dashboard[]>,
  });

export const useCreateDashboard = (slug: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDashboardInput) =>
      http.post<HttpResponse<Dashboard>>(dashboardsUrl(slug), input).then((env) => env.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [dashboardsUrl(slug)] }),
  });
};

export const useUpdateDashboard = (slug: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: DashboardUpdate }) =>
      http
        .patch<HttpResponse<Dashboard>>(`${dashboardsUrl(slug)}/${id}`, update)
        .then((env) => env.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [dashboardsUrl(slug)] }),
  });
};

export const useDeleteDashboard = (slug: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.delete(`${dashboardsUrl(slug)}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [dashboardsUrl(slug)] }),
  });
};
