"use client";

import { useParams } from "next/navigation";

import { IssueDocuments } from "@/components/spaces";

export default function Page() {
  const { slug, spaceKey } = useParams<{ slug: string; spaceKey: string }>();
  return <IssueDocuments slug={slug} spaceKey={spaceKey} />;
}
