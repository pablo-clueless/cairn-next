"use client";

import { useParams } from "next/navigation";

import { IssueCalendar } from "@/components/spaces";

export default function Page() {
  const { slug, spaceKey } = useParams<{ slug: string; spaceKey: string }>();
  return <IssueCalendar slug={slug} spaceKey={spaceKey} />;
}
