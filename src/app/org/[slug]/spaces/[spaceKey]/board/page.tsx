"use client";

import { useParams } from "next/navigation";

import { IssueBoard } from "@/components/spaces";

export default function Page() {
  const { slug, spaceKey } = useParams<{ slug: string; spaceKey: string }>();
  return <IssueBoard slug={slug} spaceKey={spaceKey} />;
}
