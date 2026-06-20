"use client";

import { useParams } from "next/navigation";

import { IssueBacklog } from "@/components/spaces";

export default function Page() {
  const { slug, spaceKey } = useParams<{ slug: string; spaceKey: string }>();
  return <IssueBacklog slug={slug} spaceKey={spaceKey} />;
}
