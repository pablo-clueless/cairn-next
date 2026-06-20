"use client";

import { useParams } from "next/navigation";

import { IssueTimeline } from "@/components/spaces";

export default function Page() {
  const { slug, spaceKey } = useParams<{ slug: string; spaceKey: string }>();
  return <IssueTimeline slug={slug} spaceKey={spaceKey} />;
}
