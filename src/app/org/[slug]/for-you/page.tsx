"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2Icon } from "lucide-react";

import { useOrg } from "@/hooks/use-orgs";
import { useIssues } from "@/hooks/use-issues";
import { useSubscription } from "@/hooks/use-subscription";
import { useUserStore } from "@/store";

const Page = () => {
  const { slug } = useParams<{ slug: string }>();
  const org = useOrg(slug);
  const sub = useSubscription(slug);
  const user = useUserStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0];

  // Work assigned to me, excluding done.
  const assigned = useIssues(slug, { assignee: "me" });
  const open = assigned.data?.filter((i) => i.status !== "done") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">For you</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back{firstName ? `, ${firstName}` : ""} — {org.data?.name}
        </p>
      </div>

      {sub.data?.status === "trialing" && !sub.data.trial_expired && (
        <div className="border-brand/30 bg-brand/5 rounded-xs border p-3 text-sm">
          Free trial — {sub.data.trial_days_remaining} day(s) remaining.
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-medium">Assigned to you</h2>
        {assigned.isLoading ? (
          <div className="grid place-items-center py-10">
            <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
          </div>
        ) : open.length > 0 ? (
          <div className="divide-y rounded-xs border">
            {open.map((it) => (
              <Link
                key={it.id}
                href={`/org/${slug}/issues/${it.key}`}
                className="hover:bg-muted/30 flex items-center justify-between gap-4 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-muted-foreground font-mono text-xs">{it.key}</span>
                  <span className="truncate text-sm">{it.title}</span>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">{it.status}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xs border border-dashed p-10 text-center">
            <p className="text-muted-foreground text-sm">Nothing assigned to you right now.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Page;
