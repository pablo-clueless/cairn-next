"use client";

import { useMutation, useQueryClient, type Query } from "@tanstack/react-query";

import { useApiQuery } from "@/lib/query";
import { http } from "@/lib/client";
import type { CreateDocumentInput, DocumentUpdate, HttpResponse, IDocument } from "@/types";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

const documentsUrl = (slug: string, spaceKey: string) =>
  `/v1/orgs/${slug}/spaces/${spaceKey}/documents`;
const documentsKey = (slug: string, spaceKey: string) => [documentsUrl(slug, spaceKey)];

// The documents list query keys as [url, params], so invalidation matches by prefix.
const documentsMatch = (slug: string, spaceKey: string) => (q: Query) =>
  q.queryKey[0] === documentsUrl(slug, spaceKey);

/** Flat list of all documents in a space (the tree is assembled client-side). */
export const useDocuments = (slug: string, spaceKey: string) =>
  useApiQuery<IDocument[]>({
    url: documentsUrl(slug, spaceKey),
    enabled: Boolean(slug && spaceKey),
    transform: data<IDocument[]>,
  });

export const useDocument = (slug: string, id: string | null) =>
  useApiQuery<IDocument>({
    url: `/v1/orgs/${slug}/documents/${id}`,
    enabled: Boolean(slug && id),
    transform: data<IDocument>,
  });

export const useCreateDocument = (slug: string, spaceKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDocumentInput) =>
      http
        .post<HttpResponse<IDocument>>(documentsUrl(slug, spaceKey), input)
        .then((env) => env.data),
    onSuccess: () => qc.invalidateQueries({ predicate: documentsMatch(slug, spaceKey) }),
  });
};

export const useUpdateDocument = (slug: string, spaceKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: DocumentUpdate }) =>
      http
        .patch<HttpResponse<IDocument>>(`/v1/orgs/${slug}/documents/${id}`, update)
        .then((env) => env.data),
    onSuccess: (doc) => {
      qc.invalidateQueries({ predicate: documentsMatch(slug, spaceKey) });
      qc.invalidateQueries({ queryKey: [`/v1/orgs/${slug}/documents/${doc.id}`] });
    },
  });
};

export const useDeleteDocument = (slug: string, spaceKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.delete(`/v1/orgs/${slug}/documents/${id}`),
    onSuccess: () => qc.invalidateQueries({ predicate: documentsMatch(slug, spaceKey) }),
  });
};

/** Re-key for completeness; the list key is used directly by callers that need it. */
export const DOCUMENTS_KEY = documentsKey;

/**
 * Assemble the flat document list into a parent→children tree, preserving the
 * server's ordering at each level. Orphans (missing parent) surface at the root.
 */
export function buildDocumentTree(docs: IDocument[]): IDocument[] {
  const byId = new Map<string, IDocument>();
  for (const d of docs) byId.set(d.id, { ...d, children: [] });

  const roots: IDocument[] = [];
  for (const d of docs) {
    const node = byId.get(d.id)!;
    const parent = d.parent_id ? byId.get(d.parent_id) : undefined;
    if (parent) parent.children!.push(node);
    else roots.push(node);
  }
  return roots;
}
