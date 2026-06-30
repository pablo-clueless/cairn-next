"use client";

import { Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { useAcceptInvite, useInvitePreview } from "@/hooks/use-orgs";
import { getApiErrorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared";
import { useLogout, useMe } from "@/hooks/use-auth";

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="grid h-screen w-screen place-items-center">
    <div className="flex w-100 max-w-[calc(100%-2rem)] flex-col items-center gap-y-6 rounded-xs border bg-white p-6 text-center dark:bg-transparent">
      <Logo />
      {children}
    </div>
  </div>
);

const AcceptInner = () => {
  const router = useRouter();
  const qc = useQueryClient();
  const token = useSearchParams().get("token") ?? "";
  const preview = useInvitePreview(token);
  const me = useMe();
  const accept = useAcceptInvite();
  const logout = useLogout();

  const switchAccount = () =>
    logout.mutate(
      {},
      {
        // Drop the cached session so the page falls back to the logged-out state,
        // where the recipient can sign in/up with the invited email.
        onSettled: () => qc.invalidateQueries({ queryKey: ["/v1/me"] }),
      },
    );

  if (!token) {
    return (
      <Card>
        <p className="font-medium">This invitation link is invalid.</p>
        <Link className="link before:bg-foreground text-sm" href="/dashboard">
          Go to dashboard
        </Link>
      </Card>
    );
  }

  if (preview.isLoading || me.isLoading) {
    return (
      <Card>
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </Card>
    );
  }

  // Bad / unknown token.
  if (preview.isError || !preview.data) {
    return (
      <Card>
        <p className="font-medium">This invitation link is invalid or has expired.</p>
        <p className="text-muted-foreground text-sm">Ask the inviter to send you a new invite.</p>
        <Link className="link before:bg-foreground text-sm" href="/dashboard">
          Go to dashboard
        </Link>
      </Card>
    );
  }

  const invite = preview.data;
  const invitedEmail = invite.email;

  if (invite.status === "accepted") {
    return (
      <Card>
        <p className="font-medium">This invitation has already been accepted.</p>
        <Link className="link before:bg-foreground text-sm" href="/dashboard">
          Go to dashboard
        </Link>
      </Card>
    );
  }

  if (invite.status === "expired") {
    return (
      <Card>
        <p className="font-medium">This invitation has expired</p>
        <p className="text-muted-foreground text-sm">
          Invitations to <span className="text-foreground">{invite.org_name}</span> are only valid
          for a limited time. Ask the inviter to re-send it.
        </p>
        <Link className="link before:bg-foreground text-sm" href="/dashboard">
          Go to dashboard
        </Link>
      </Card>
    );
  }

  // Not signed in — point them at the invited email.
  if (me.isError || !me.data) {
    return (
      <Card>
        <p className="font-medium">
          You&apos;ve been invited to join{" "}
          <span className="text-foreground">{invite.org_name}</span> on Cairn
        </p>
        <p className="text-muted-foreground text-sm">
          This invite was sent to <span className="text-foreground">{invitedEmail}</span>. Sign in
          (or create an account) with that email, then reopen this link.
        </p>
        <div className="flex items-center gap-x-4">
          <Link className="link before:bg-foreground text-sm" href="/">
            Log in
          </Link>
          <span className="size-1 rounded-full bg-gray-300" />
          <Link className="link before:bg-foreground text-sm" href="/create-account">
            Create account
          </Link>
        </div>
      </Card>
    );
  }

  if (me.data.is_platform_admin) {
    return (
      <Card>
        <p className="font-medium">Platform admins can&apos;t join organizations</p>
        <p className="text-muted-foreground text-sm">
          This account operates the platform, so it can&apos;t belong to an organization. Sign in
          with <span className="text-foreground">{invitedEmail}</span> to accept.
        </p>
        <Button className="w-full" variant="outline" disabled={logout.isPending} onClick={switchAccount}>
          {logout.isPending ? "Signing out…" : "Sign out & switch account"}
        </Button>
      </Card>
    );
  }

  // Signed in as the wrong account — the original bug. Warn instead of silently
  // showing the wrong email (and the backend would reject the accept anyway).
  if (me.data.email.toLowerCase() !== invitedEmail.toLowerCase()) {
    return (
      <Card>
        <p className="font-medium">This invitation is for a different account</p>
        <p className="text-muted-foreground text-sm">
          It was sent to <span className="text-foreground">{invitedEmail}</span>, but you&apos;re
          signed in as <span className="text-foreground">{me.data.email}</span>. Switch accounts to
          accept.
        </p>
        <Button className="w-full" disabled={logout.isPending} onClick={switchAccount}>
          {logout.isPending ? "Signing out…" : "Sign out & switch account"}
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <p className="font-medium">
        You&apos;ve been invited to join <span className="text-foreground">{invite.org_name}</span> on
        Cairn
      </p>
      <p className="text-muted-foreground text-sm">
        Accepting as <span className="text-foreground">{me.data.email}</span>
      </p>
      <Button
        className="w-full"
        disabled={accept.isPending}
        onClick={() =>
          accept.mutate(token, {
            onSuccess: (org) => {
              toast.success(`Joined ${org.name}`);
              router.push(`/org/${org.slug}/for-you`);
            },
            onError: (error) => toast.error(getApiErrorMessage(error)),
          })
        }
      >
        {accept.isPending ? "Joining…" : "Accept invitation"}
      </Button>
    </Card>
  );
};

const Page = () => (
  <Suspense
    fallback={
      <div className="grid h-screen place-items-center">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    }
  >
    <AcceptInner />
  </Suspense>
);

export default Page;
