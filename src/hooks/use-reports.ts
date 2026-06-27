"use client";

import { useApiQuery } from "@/lib/query";
import type { BurndownPoint, CFDPoint, HttpResponse, VelocityPoint } from "@/types";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

const reportsBase = (slug: string, spaceKey: string) =>
  `/v1/orgs/${slug}/spaces/${spaceKey}/reports`;

export const useVelocity = (slug: string, spaceKey: string) =>
  useApiQuery<VelocityPoint[]>({
    url: `${reportsBase(slug, spaceKey)}/velocity`,
    enabled: Boolean(slug && spaceKey),
    transform: data<VelocityPoint[]>,
  });

export const useBurndown = (slug: string, spaceKey: string, sprintId: string | undefined) =>
  useApiQuery<BurndownPoint[]>({
    url: `${reportsBase(slug, spaceKey)}/burndown?sprint=${sprintId ?? ""}`,
    enabled: Boolean(slug && spaceKey && sprintId),
    transform: data<BurndownPoint[]>,
  });

export const useCFD = (slug: string, spaceKey: string, days = 30) =>
  useApiQuery<CFDPoint[]>({
    url: `${reportsBase(slug, spaceKey)}/cfd?days=${days}`,
    enabled: Boolean(slug && spaceKey),
    transform: data<CFDPoint[]>,
  });
