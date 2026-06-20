"use client";

import { Bell } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";

export const Notifications = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="outline">
          <Bell className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 gap-0">
        <div className="flex w-full items-center justify-between">
          <p className="text-sm font-medium">Notifications</p>
          <Button size="xs" variant="ghost">
            Mark all
          </Button>
        </div>
        <div className="mt-2 border-t pt-2"></div>
      </PopoverContent>
    </Popover>
  );
};
