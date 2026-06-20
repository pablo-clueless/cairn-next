"use client";

import { PanelLeft } from "lucide-react";

import { Notifications } from "./notifications";
import { useAppContext } from "../providers";
import { UserMenu } from "./user-menu";
import { Input } from "../ui/input";

export const Header = () => {
  const { isCollapsed, onCollapsedChange } = useAppContext();

  return (
    <header className="flex h-14 w-full items-center justify-between border-b px-4">
      <div className="flex items-center gap-x-4">
        <div className="flex items-center border-r pr-4">
          <button
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="text-muted-foreground hover:text-foreground shrink-0"
            onClick={onCollapsedChange}
            type="button"
          >
            <PanelLeft className="size-4" />
          </button>
        </div>
        <div className="flex items-center gap-x-2">
          <Input className="w-150" placeholder="Search…" />
        </div>
      </div>
      <div className="flex items-center gap-x-4">
        <Notifications />
        <UserMenu />
      </div>
    </header>
  );
};
