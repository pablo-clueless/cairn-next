"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";

import { CreateIssueDialog, SpaceTabNav } from "@/components/spaces";
import { useOrg } from "@/hooks/use-orgs";
import { useSpace } from "@/hooks/use-spaces";

export default function SpaceLayout({ children }: { children: React.ReactNode }) {
  const { slug, spaceKey } = useParams<{ slug: string; spaceKey: string }>();
  const space = useSpace(slug, spaceKey);
  const org = useOrg(slug);
  const canCreate = org.data?.role !== "guest";

  if (space.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }
  if (space.isError || !space.data) {
    return <p className="text-muted-foreground">Space not found.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Link
          href={`/org/${slug}/spaces`}
          className="text-muted-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-3.5" /> Spaces
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl font-semibold">{space.data.name}</h1>
            <span className="bg-muted rounded px-1.5 py-0.5 text-xs">{space.data.key}</span>
          </div>
          {canCreate && <CreateIssueDialog slug={slug} spaceKey={space.data.key} />}
        </div>
      </div>
      <SpaceTabNav />
      <div>{children}</div>
    </div>
  );
}
