"use client";

import React from "react";

import { TimelineFunctions } from "./timeline-functions";
import { useIssues } from "@/hooks/use-issues";
import { useMembers } from "@/hooks/use-orgs";

export const IssueCalendar = ({ slug, spaceKey }: { slug: string; spaceKey: string }) => {
  const issues = useIssues(slug);
  const members = useMembers(slug);

  return (
    <div className="space-y-6">
      <TimelineFunctions
        slug={slug}
        spaceKey={spaceKey}
        filters={[]}
        issues={issues}
        members={members}
        onFilterChange={() => {}}
        onSearch={() => {}}
      />
    </div>
  );
};
