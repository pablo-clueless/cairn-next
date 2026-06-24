"use client";

import { useMutation, useQueryClient, type Query } from "@tanstack/react-query";

import { useApiQuery } from "@/lib/query";
import { http } from "@/lib/client";
import type { Comment, CommentUpdate, CreateCommentInput, HttpResponse } from "@/types";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

const commentsUrl = (slug: string, issueKey: string) =>
  `/v1/orgs/${slug}/issues/${issueKey}/comments`;

// useApiQuery keys as [url, params], so invalidation matches the url prefix.
const commentsMatch = (slug: string, issueKey: string) => (q: Query) =>
  q.queryKey[0] === commentsUrl(slug, issueKey);

/** An issue's comments, oldest-first (the server's order). */
export const useComments = (slug: string, issueKey: string) =>
  useApiQuery<Comment[]>({
    url: commentsUrl(slug, issueKey),
    enabled: Boolean(slug && issueKey),
    transform: data<Comment[]>,
  });

export const useCreateComment = (slug: string, issueKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCommentInput) =>
      http
        .post<HttpResponse<Comment>>(commentsUrl(slug, issueKey), input)
        .then((env) => env.data),
    onSuccess: () => qc.invalidateQueries({ predicate: commentsMatch(slug, issueKey) }),
  });
};

export const useUpdateComment = (slug: string, issueKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: CommentUpdate }) =>
      http
        .patch<HttpResponse<Comment>>(`/v1/orgs/${slug}/comments/${id}`, update)
        .then((env) => env.data),
    onSuccess: () => qc.invalidateQueries({ predicate: commentsMatch(slug, issueKey) }),
  });
};

export const useDeleteComment = (slug: string, issueKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.delete(`/v1/orgs/${slug}/comments/${id}`),
    onSuccess: () => qc.invalidateQueries({ predicate: commentsMatch(slug, issueKey) }),
  });
};
