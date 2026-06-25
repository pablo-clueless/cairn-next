"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";

import { useMe } from "@/hooks/use-auth";
import { NotificationPreferencesCard } from "@/components/shared/notification-preferences";

const Page = () => {
  const router = useRouter();
  const me = useMe();

  useEffect(() => {
    if (me.isError) router.replace("/");
  }, [me.isError, router]);

  if (me.isLoading || !me.data) {
    return (
      <div className="grid h-screen place-items-center">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  const u = me.data;
  const back = u.default_org_slug ? `/org/${u.default_org_slug}/for-you` : "/dashboard";

  return (
    <div className="mx-auto max-w-md space-y-6 px-6 py-10">
      <Link href={back} className="text-muted-foreground inline-flex items-center gap-1 text-sm">
        <ArrowLeftIcon className="size-3.5" /> Back
      </Link>
      <h1 className="font-heading text-xl font-semibold">Profile</h1>
      <div className="space-y-3 rounded-xs border p-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Name</p>
          <p>{u.name}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Email</p>
          <p>{u.email}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Role</p>
          <p>{u.is_platform_admin ? "Platform admin" : "Member"}</p>
        </div>
      </div>
      <NotificationPreferencesCard />
    </div>
  );
};

export default Page;
