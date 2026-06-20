"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiMutation, useApiQuery } from "@/lib/query";
import { http } from "@/lib/client";
import type {
  HttpResponse,
  Invitation,
  InvitableRole,
  InviteResult,
  Member,
  Organization,
  Role,
} from "@/types";

const data = <T>(raw: unknown) => (raw as HttpResponse<T>).data;

const ORGS_KEY = ["/v1/orgs"];
const membersKey = (orgId: string) => [`/v1/orgs/${orgId}/members`];
const invitesKey = (orgId: string) => [`/v1/orgs/${orgId}/invitations`];

export const useOrgs = () =>
  useApiQuery<Organization[]>({ url: "/v1/orgs", transform: data<Organization[]> });

export const useOrg = (orgId: string) =>
  useApiQuery<Organization>({
    url: `/v1/orgs/${orgId}`,
    enabled: Boolean(orgId),
    transform: data<Organization>,
  });

export const useCreateOrg = () =>
  useApiMutation<Organization, { name: string }>({
    method: "POST",
    url: "/v1/orgs",
    transform: data<Organization>,
    invalidates: [ORGS_KEY],
  });

export const useMembers = (orgId: string) =>
  useApiQuery<Member[]>({
    url: `/v1/orgs/${orgId}/members`,
    enabled: Boolean(orgId),
    transform: data<Member[]>,
  });

export const useInvitations = (orgId: string, enabled = true) =>
  useApiQuery<Invitation[]>({
    url: `/v1/orgs/${orgId}/invitations`,
    enabled: Boolean(orgId) && enabled,
    transform: data<Invitation[]>,
  });

export const useInvite = (orgId: string) =>
  useApiMutation<InviteResult, { email: string; role: InvitableRole }>({
    method: "POST",
    url: `/v1/orgs/${orgId}/invitations`,
    transform: data<InviteResult>,
    invalidates: [invitesKey(orgId)],
  });

/** Accept an invitation by PATCHing the invitation resource (by token). */
export const useAcceptInvite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      http
        .patch<HttpResponse<Organization>>(`/v1/invitations/${token}`, { status: "accepted" })
        .then((env) => env.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ORGS_KEY }),
  });
};

/** Member role update — dynamic URL, so a direct mutation. */
export const useUpdateMemberRole = (orgId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      http.patch(`/v1/orgs/${orgId}/members/${userId}`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(orgId) }),
  });
};

export const useRemoveMember = (orgId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => http.delete(`/v1/orgs/${orgId}/members/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(orgId) }),
  });
};

export const useRevokeInvite = (orgId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => http.delete(`/v1/orgs/${orgId}/invitations/${inviteId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: invitesKey(orgId) }),
  });
};
