"use client";

import { useMutation, useQueryClient, type Query } from "@tanstack/react-query";

import { useApiQuery } from "@/lib/query";
import { http } from "@/lib/client";
import type { HttpResponse, Invitation, Member } from "@/types";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

const membersUrl = (slug: string, spaceKey: string) =>
  `/v1/orgs/${slug}/spaces/${spaceKey}/members`;
const invitesUrl = (slug: string, spaceKey: string) =>
  `/v1/orgs/${slug}/spaces/${spaceKey}/invitations`;

const membersMatch = (slug: string, spaceKey: string) => (q: Query) =>
  q.queryKey[0] === membersUrl(slug, spaceKey);
const invitesMatch = (slug: string, spaceKey: string) => (q: Query) =>
  q.queryKey[0] === invitesUrl(slug, spaceKey);

/** Outcome of inviting by email: an existing member added, or an invite sent. */
interface SpaceInviteResult {
  status: "added" | "invited";
  user_id?: string;
  invitation?: Invitation;
  accept_url?: string;
}

// Adding/removing a space member changes which spaces a user can see.
const spacesMatch = (slug: string) => (q: Query) => {
  const k = q.queryKey[0];
  return typeof k === "string" && k.startsWith(`/v1/orgs/${slug}/spaces`);
};

/** The members of a space. */
export const useSpaceMembers = (slug: string, spaceKey: string) =>
  useApiQuery<Member[]>({
    url: membersUrl(slug, spaceKey),
    enabled: Boolean(slug && spaceKey),
    transform: data<Member[]>,
  });

export const useAddSpaceMember = (slug: string, spaceKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => http.post(membersUrl(slug, spaceKey), { user_id: userId }),
    onSuccess: () => {
      qc.invalidateQueries({ predicate: membersMatch(slug, spaceKey) });
      qc.invalidateQueries({ predicate: spacesMatch(slug) });
    },
  });
};

export const useRemoveSpaceMember = (slug: string, spaceKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => http.delete(`${membersUrl(slug, spaceKey)}/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ predicate: membersMatch(slug, spaceKey) });
      qc.invalidateQueries({ predicate: spacesMatch(slug) });
    },
  });
};

/** Pending email invitations targeting this space. */
export const useSpaceInvitations = (slug: string, spaceKey: string) =>
  useApiQuery<Invitation[]>({
    url: invitesUrl(slug, spaceKey),
    enabled: Boolean(slug && spaceKey),
    transform: data<Invitation[]>,
  });

/** Invite by email: adds an existing org member directly, else sends an invite. */
export const useInviteToSpace = (slug: string, spaceKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role?: string }) =>
      http
        .post<HttpResponse<SpaceInviteResult>>(invitesUrl(slug, spaceKey), input)
        .then((env) => env.data),
    onSuccess: () => {
      qc.invalidateQueries({ predicate: membersMatch(slug, spaceKey) });
      qc.invalidateQueries({ predicate: invitesMatch(slug, spaceKey) });
      qc.invalidateQueries({ predicate: spacesMatch(slug) });
    },
  });
};

/** Re-send a pending invite: rotates the token, extends expiry, re-emails. */
export const useResendSpaceInvitation = (slug: string, spaceKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) =>
      http
        .patch<HttpResponse<SpaceInviteResult>>(`${invitesUrl(slug, spaceKey)}/${inviteId}`, {
          status: "resent",
        })
        .then((env) => env.data),
    onSuccess: () => qc.invalidateQueries({ predicate: invitesMatch(slug, spaceKey) }),
  });
};

export const useDeleteSpaceInvitation = (slug: string, spaceKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => http.delete(`${invitesUrl(slug, spaceKey)}/${inviteId}`),
    onSuccess: () => qc.invalidateQueries({ predicate: invitesMatch(slug, spaceKey) }),
  });
};
