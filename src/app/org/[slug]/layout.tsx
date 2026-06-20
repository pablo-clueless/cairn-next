"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";

import { Header, Sidebar } from "@/components/shared";
import { useMe } from "@/hooks/use-auth";
import { useOrg } from "@/hooks/use-orgs";
import { useUserStore } from "@/store";

const Spinner = () => (
  <div className="grid h-screen place-items-center">
    <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
  </div>
);

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const signin = useUserStore((s) => s.signin);
  const me = useMe();
  const org = useOrg(slug);

  useEffect(() => {
    if (me.data) void signin(me.data);
  }, [me.data, signin]);
  useEffect(() => {
    if (me.isError) router.replace("/");
  }, [me.isError, router]);
  useEffect(() => {
    if (org.isError) router.replace("/dashboard");
  }, [org.isError, router]);

  if (me.isLoading || org.isLoading) return <Spinner />;
  if (me.isError || org.isError || !org.data) return null;

  return (
    <div className="flex h-screen w-screen items-start">
      <Sidebar />
      <main className="flex h-full flex-1 flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </main>
    </div>
  );
}
