"use client";

import { Form } from "lucide-react";

export const IssueForms = ({}: { slug: string; spaceKey: string }) => {
  return (
    <div className="grid h-full place-items-center space-y-6 rounded-xs border border-dashed">
      <div className="flex flex-col items-center gap-y-6">
        <Form className="size-15" />
        <p className="font-medium">Forms are coming soon</p>
      </div>
    </div>
  );
};
