"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Header, Sidebar } from "@/components/shared";
import { useMe } from "@/hooks/use-auth";
import { useUserStore } from "@/store";

// The /dashboard area is the platform-admin console (and org creation). It has
// no active org, so it uses the self-contained Header without the org Sidebar.
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const me = useMe();
  const signin = useUserStore((s) => s.signin);

  useEffect(() => {
    if (me.data) void signin(me.data);
  }, [me.data, signin]);
  useEffect(() => {
    if (me.isError) router.replace("/");
  }, [me.isError, router]);

  if (me.isLoading) {
    return (
      <div className="grid h-screen place-items-center">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }
  if (me.isError) return null;

  return (
    <div className="flex h-screen w-screen items-start">
      <Sidebar />
      <main className="flex h-full flex-1 flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
