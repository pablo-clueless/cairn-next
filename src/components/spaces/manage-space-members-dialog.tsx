"use client";

import { Loader2Icon, MailIcon, UsersIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getApiErrorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMembers } from "@/hooks/use-orgs";
import { getInitials } from "@/lib/string";
import { Badge } from "../ui/badge";
import {
  useAddSpaceMember,
  useDeleteSpaceInvitation,
  useInviteToSpace,
  useRemoveSpaceMember,
  useResendSpaceInvitation,
  useSpaceInvitations,
  useSpaceMembers,
} from "@/hooks/use-space-members";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  slug: string;
  spaceKey: string;
}

/** Manage space access: add existing org members, invite new people by email,
 * see/revoke pending invites, and remove members. */
export const ManageSpaceMembersDialog = ({ slug, spaceKey }: Props) => {
  const spaceMembers = useSpaceMembers(slug, spaceKey);
  const orgMembers = useMembers(slug);
  const invitations = useSpaceInvitations(slug, spaceKey);
  const addMember = useAddSpaceMember(slug, spaceKey);
  const removeMember = useRemoveSpaceMember(slug, spaceKey);
  const invite = useInviteToSpace(slug, spaceKey);
  const resend = useResendSpaceInvitation(slug, spaceKey);
  const revoke = useDeleteSpaceInvitation(slug, spaceKey);

  const [resendingId, setResendingId] = useState<string | null>(null);

  const [email, setEmail] = useState("");

  const members = spaceMembers.data ?? [];
  const memberIds = new Set(members.map((m) => m.user_id));
  const candidates = (orgMembers.data ?? []).filter((m) => !memberIds.has(m.user_id));
  const pending = invitations.data ?? [];

  const addExisting = (userId: string) =>
    addMember.mutate(userId, { onError: (e) => toast.error(getApiErrorMessage(e)) });

  const sendInvite = () => {
    const value = email.trim();
    if (!value) return;
    invite.mutate(
      { email: value },
      {
        onSuccess: (res) => {
          setEmail("");
          toast.success(res.status === "added" ? "Added to space" : `Invitation sent to ${value}`);
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );
  };

  const resendInvite = (inv: { id: string; email: string }) => {
    setResendingId(inv.id);
    resend.mutate(inv.id, {
      onSuccess: () => toast.success(`Invitation re-sent to ${inv.email}`),
      onError: (e) => toast.error(getApiErrorMessage(e)),
      onSettled: () => setResendingId(null),
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" title="Members">
          <UsersIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>Space members</DialogTitle>
          <DialogDescription>
            Only members of this space can see and work in it. Org owners and admins always have
            access.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {candidates.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium">Add an existing member</p>
              <div className="flex items-center gap-2">
                <Select value="" onValueChange={addExisting}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choose someone in the org…" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.name} · {m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addMember.isPending && <Loader2Icon className="size-4 animate-spin" />}
              </div>
            </div>
          )}
          <div>
            <p className="mb-1 text-xs font-medium">Invite by email</p>
            <div className="flex items-center gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                onKeyDown={(e) => e.key === "Enter" && sendInvite()}
              />
              <Button disabled={!email.trim() || invite.isPending} onClick={sendInvite}>
                {invite.isPending ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <MailIcon className="size-3.5" />
                )}
                Invite
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium">Members ({members.length})</p>
            {spaceMembers.isLoading ? (
              <div className="grid place-items-center py-4">
                <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
              </div>
            ) : (
              <ul className="space-y-1.5">
                {members.map((m) => (
                  <li key={m.user_id} className="flex items-center gap-2 text-sm">
                    <Avatar className="size-7">
                      <AvatarFallback className="text-[10px]">{getInitials(m.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{m.name}</p>
                      <p className="text-muted-foreground truncate text-xs">{m.email}</p>
                    </div>
                    <span className="text-muted-foreground ml-auto text-xs capitalize">
                      {m.role}
                    </span>
                    <button
                      type="button"
                      aria-label="Remove from space"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      disabled={removeMember.isPending}
                      onClick={() =>
                        removeMember.mutate(m.user_id, {
                          onError: (e) => toast.error(getApiErrorMessage(e)),
                        })
                      }
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {pending.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium">Pending invitations</p>
              <ul className="space-y-1.5">
                {pending.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-x-1">
                      <MailIcon className="text-muted-foreground size-3.5 shrink-0" />
                      <span className="truncate">{inv.email}</span>
                      <Badge size="sm" variant="warning">
                        Pending
                      </Badge>
                    </div>
                    <div className="flex items-center gap-x-2">
                      <Button
                        aria-label="Re-send invitation"
                        disabled={resend.isPending}
                        onClick={() => resendInvite(inv)}
                        size="xs"
                        title="Re-send invitation"
                        type="button"
                      >
                        {resendingId === inv.id ? (
                          <Loader2Icon className="size-3 animate-spin" />
                        ) : (
                          "Resend Invite"
                        )}
                      </Button>
                      <button
                        type="button"
                        aria-label="Revoke invitation"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        disabled={revoke.isPending}
                        onClick={() =>
                          revoke.mutate(inv.id, {
                            onError: (e) => toast.error(getApiErrorMessage(e)),
                          })
                        }
                      >
                        <XIcon className="size-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
