"use client";

import { useMutation, useQueryClient, type Query } from "@tanstack/react-query";

import { useApiQuery } from "@/lib/query";
import { client, http } from "@/lib/client";
import type { Attachment, HttpResponse } from "@/types";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

const attachmentsUrl = (slug: string, issueKey: string) =>
  `/v1/orgs/${slug}/issues/${issueKey}/attachments`;

const attachmentsMatch = (slug: string, issueKey: string) => (q: Query) =>
  q.queryKey[0] === attachmentsUrl(slug, issueKey);

/** Direct download URL for an attachment (auth rides on the httpOnly cookie). */
export const attachmentDownloadUrl = (slug: string, id: string) =>
  `${process.env.NEXT_PUBLIC_API_URL ?? ""}/v1/orgs/${slug}/attachments/${id}`;

/** An issue's attachments, oldest first. */
export const useAttachments = (slug: string, issueKey: string) =>
  useApiQuery<Attachment[]>({
    url: attachmentsUrl(slug, issueKey),
    enabled: Boolean(slug && issueKey),
    transform: data<Attachment[]>,
  });

export const useUploadAttachment = (slug: string, issueKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      // Bypass the JSON `http` helper so axios sets the multipart boundary.
      return client
        .post<HttpResponse<Attachment>>(attachmentsUrl(slug, issueKey), form, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data.data);
    },
    onSuccess: () => qc.invalidateQueries({ predicate: attachmentsMatch(slug, issueKey) }),
  });
};

export const useDeleteAttachment = (slug: string, issueKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.delete(`/v1/orgs/${slug}/attachments/${id}`),
    onSuccess: () => qc.invalidateQueries({ predicate: attachmentsMatch(slug, issueKey) }),
  });
};
