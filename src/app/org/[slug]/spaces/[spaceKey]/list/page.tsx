"use client";

import { useParams } from "next/navigation";

import { IssueTable } from "@/components/spaces";

export default function Page() {
  const { slug, spaceKey } = useParams<{ slug: string; spaceKey: string }>();
  return <IssueTable slug={slug} spaceKey={spaceKey} />;
}
