"use client";

import { ArrowLeftIcon, Loader2Icon, MoreHorizontal, Users } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CreateIssueDialog, SpaceTabNav } from "@/components/spaces";
import { ScrollArea } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useSpace } from "@/hooks/use-spaces";
import { useMembers } from "@/hooks/use-orgs";
import { useOrg } from "@/hooks/use-orgs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function SpaceLayout({ children }: { children: React.ReactNode }) {
  const { slug, spaceKey } = useParams<{ slug: string; spaceKey: string }>();
  const space = useSpace(slug, spaceKey);
  const members = useMembers(slug);
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
    <div className="h-full space-y-4">
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
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline">
                  <Users className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="">
                  <SheetTitle></SheetTitle>
                  <SheetDescription></SheetDescription>
                </div>
                <ScrollArea className="min-h-0">
                  <div className="w-full space-y-2">
                    {members.data?.map((member) => (
                      <div className="" key={member.user_id}></div>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreHorizontal className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start"></PopoverContent>
            </Popover>
          </div>
          {canCreate && <CreateIssueDialog slug={slug} spaceKey={space.data.key} />}
        </div>
      </div>
      <SpaceTabNav />
      <div className="h-[calc(100%-130px)]">{children}</div>
    </div>
  );
}
