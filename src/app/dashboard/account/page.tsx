"use client";

import { Loader2Icon } from "lucide-react";

import { useMe } from "@/hooks/use-auth";

const Field = ({ label, value }: { label: string; value?: string }) => (
  <div className="space-y-1">
    <p className="text-muted-foreground text-xs">{label}</p>
    <p className="text-sm">{value ?? "—"}</p>
  </div>
);

const Page = () => {
  const me = useMe();

  if (me.isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-medium">Account</p>
        <p className="text-muted-foreground text-sm">Your platform account</p>
      </div>
      <div className="max-w-lg space-y-4 rounded-xs border p-4">
        <Field label="Name" value={me.data?.name} />
        <Field label="Email" value={me.data?.email} />
        <Field label="Role" value={me.data?.is_platform_admin ? "Platform admin" : "Member"} />
      </div>
    </div>
  );
};

export default Page;
