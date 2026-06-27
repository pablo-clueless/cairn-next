"use client";

import { useApiQuery } from "@/lib/query";
import type { HttpResponse, Issue } from "@/types";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

/**
 * Relevance-ranked issue search. Stays disabled until the query has at least two
 * characters so we don't hammer the API on every keystroke.
 */
export const useSearchIssues = (slug: string, query: string) =>
  useApiQuery<Issue[]>({
    url: `/v1/orgs/${slug}/search?q=${encodeURIComponent(query)}`,
    enabled: Boolean(slug && query.trim().length >= 2),
    transform: data<Issue[]>,
  });
