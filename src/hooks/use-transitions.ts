"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { HttpResponse, StatusTransition, TransitionInput } from "@/types";
import { useApiQuery } from "@/lib/query";
import { http } from "@/lib/client";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

const transitionsUrl = (slug: string, spaceKey: string) =>
  `/v1/orgs/${slug}/spaces/${spaceKey}/transitions`;
const transitionsKey = (slug: string, spaceKey: string) => [transitionsUrl(slug, spaceKey)];

export const useTransitions = (slug: string, spaceKey: string) =>
  useApiQuery<StatusTransition[]>({
    url: transitionsUrl(slug, spaceKey),
    enabled: Boolean(slug && spaceKey),
    transform: data<StatusTransition[]>,
  });

/** Replace a space's entire workflow. Send `[]` to reset to an open workflow. */
export const useSetTransitions = (slug: string, spaceKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (transitions: TransitionInput[]) =>
      http
        .put<HttpResponse<StatusTransition[]>>(transitionsUrl(slug, spaceKey), { transitions })
        .then((env) => env.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: transitionsKey(slug, spaceKey) }),
  });
};

/**
 * Mirrors the backend rule so the UI can pre-empt a doomed status change:
 * an empty workflow allows anything; a no-op is always allowed; otherwise a
 * matching edge (possibly global, `from_status_id === null`) must exist.
 */
export function isTransitionAllowed(
  transitions: StatusTransition[] | undefined,
  fromStatusId: string,
  toStatusId: string,
): boolean {
  if (fromStatusId === toStatusId) return true;
  if (!transitions || transitions.length === 0) return true;
  return transitions.some(
    (t) =>
      t.to_status_id === toStatusId &&
      (t.from_status_id === fromStatusId || t.from_status_id === null),
  );
}
