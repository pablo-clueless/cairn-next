"use client";

import React from "react";

import { useIssues } from "@/hooks/use-issues";

export const IssueTimeline = ({ slug }: { slug: string; spaceKey: string }) => {
  const issues = useIssues(slug);

  return <div className="space-y-6"></div>;
};
