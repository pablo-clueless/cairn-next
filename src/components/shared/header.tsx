"use client";

import { useEffect, useState } from "react";
import { PanelLeft, SearchIcon } from "lucide-react";

import { Notifications } from "./notifications";
import { SearchCommand } from "./search-command";
import { useAppContext } from "../providers";
import { UserMenu } from "./user-menu";

export const Header = () => {
  const { isCollapsed, onCollapsedChange, organization } = useAppContext();
  const [searchOpen, setSearchOpen] = useState(false);
  const slug = organization?.slug ?? "";

  // ⌘K / Ctrl+K opens search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
        <button
          type="button"
          disabled={!slug}
          onClick={() => setSearchOpen(true)}
          className="text-muted-foreground hover:bg-accent flex h-9 w-150 items-center gap-2 rounded-md border px-3 text-sm disabled:opacity-50"
        >
          <SearchIcon className="size-4" />
          <span>Search issues…</span>
          <kbd className="bg-muted ml-auto rounded px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
        </button>
      </div>
      <div className="flex items-center gap-x-4">
        <Notifications />
        <UserMenu />
      </div>
      {slug && <SearchCommand slug={slug} open={searchOpen} onOpenChange={setSearchOpen} />}
    </header>
  );
};
