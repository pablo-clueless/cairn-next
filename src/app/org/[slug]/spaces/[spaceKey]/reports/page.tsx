"use client";

import { useParams } from "next/navigation";

import { SpaceReports } from "@/components/spaces";

export default function Page() {
  const { slug, spaceKey } = useParams<{ slug: string; spaceKey: string }>();
  return <SpaceReports slug={slug} spaceKey={spaceKey} />;
}
