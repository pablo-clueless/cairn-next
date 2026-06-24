"use client";

import { useMutation, useQueryClient, type Query } from "@tanstack/react-query";

import { useApiQuery } from "@/lib/query";
import { http } from "@/lib/client";
import type { CreateLinkInput, HttpResponse, IssueLinkView } from "@/types";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

const linksUrl = (slug: string, issueKey: string) =>
  `/v1/orgs/${slug}/issues/${issueKey}/links`;

const linksMatch = (slug: string, issueKey: string) => (q: Query) =>
  q.queryKey[0] === linksUrl(slug, issueKey);

/** Links touching an issue, from that issue's perspective (other end populated). */
export const useIssueLinks = (slug: string, issueKey: string) =>
  useApiQuery<IssueLinkView[]>({
    url: linksUrl(slug, issueKey),
    enabled: Boolean(slug && issueKey),
    transform: data<IssueLinkView[]>,
  });

export const useCreateLink = (slug: string, issueKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLinkInput) =>
      http
        .post<HttpResponse<IssueLinkView>>(linksUrl(slug, issueKey), input)
        .then((env) => env.data),
    onSuccess: () => qc.invalidateQueries({ predicate: linksMatch(slug, issueKey) }),
  });
};

export const useDeleteLink = (slug: string, issueKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => http.delete(`/v1/orgs/${slug}/links/${linkId}`),
    onSuccess: () => qc.invalidateQueries({ predicate: linksMatch(slug, issueKey) }),
  });
};
