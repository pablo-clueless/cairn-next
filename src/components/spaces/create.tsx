"use client";

import { Plus } from "lucide-react";
import React from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog";

interface Props {
  segment: string;
}

export const Create = ({ segment }: Props) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button onClick={(e) => e.stopPropagation()}>
          <Plus className="size-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <div>
          <DialogTitle>New {segment}</DialogTitle>
          <DialogDescription></DialogDescription>
        </div>
        <div></div>
      </DialogContent>
    </Dialog>
  );
};
