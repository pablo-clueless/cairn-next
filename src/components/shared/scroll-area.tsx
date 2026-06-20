import React from "react";

import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
  hideScrollbar?: boolean;
  orientation?: "horizontal" | "vertical" | "both";
  ref?: React.RefObject<HTMLDivElement | null>;
}

export const ScrollArea = ({
  children,
  className,
  orientation = "vertical",
  hideScrollbar = true,
  ref,
}: Props) => {
  return (
    <div
      className={cn(
        "scroll-area overflow-auto",
        orientation === "vertical" && "overflow-x-hidden overflow-y-auto",
        orientation === "horizontal" && "overflow-x-auto overflow-y-hidden",
        orientation === "both" && "overflow-auto",
        hideScrollbar ? "scrollbar-hide" : "custom-scrollbar",
        className,
      )}
      ref={ref}
    >
      {children}
    </div>
  );
};
