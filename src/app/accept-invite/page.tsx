"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared";
import { getApiErrorMessage } from "@/lib/client";
import { useMe } from "@/hooks/use-auth";
import { useAcceptInvite } from "@/hooks/use-orgs";

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
  const token = useSearchParams().get("token") ?? "";
  const me = useMe();
  const accept = useAcceptInvite();

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

  if (me.isLoading) {
    return (
      <Card>
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </Card>
    );
  }

  if (me.isError) {
    return (
      <Card>
        <p className="font-medium">Log in to accept your invitation</p>
        <p className="text-muted-foreground text-sm">
          Sign in (or create an account) with the email the invite was sent to, then reopen this
          link.
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

  if (me.data?.is_platform_admin) {
    return (
      <Card>
        <p className="font-medium">Platform admins can&apos;t join organizations</p>
        <p className="text-muted-foreground text-sm">
          This account operates the platform, so it can&apos;t belong to an organization. Ask the
          inviter to send the invitation to a different email.
        </p>
        <Link className="link before:bg-foreground text-sm" href="/dashboard">
          Go to admin console
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <p className="font-medium">You&apos;ve been invited to join an organization on Cairn</p>
      <p className="text-muted-foreground text-sm">
        Accepting as <span className="text-foreground">{me.data?.email}</span>
      </p>
      <Button
        className="w-full"
        disabled={accept.isPending}
        onClick={() =>
          accept.mutate(token, {
            onSuccess: (org) => {
              toast.success(`Joined ${org.name}`);
              router.push(`/dashboard/orgs/${org.id}`);
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
