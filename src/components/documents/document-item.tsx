"use client";

import { format } from "date-fns";
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FilePen,
  FileText,
  Folder,
  Plus,
  SquareArrowOutUpRight,
  Trash2,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import type { DocumentType, IDocument } from "@/types";
import { getInitials } from "@/lib/string";

interface Props {
  document: IDocument;
  depth?: number;
  onOpen: (id: string) => void;
  onCreate: (type: DocumentType, parentId: string) => void;
  onDelete: (doc: IDocument) => void;
}

const CHILD_OPTIONS: { label: string; value: DocumentType; icon: typeof FilePen }[] = [
  { label: "Live doc", value: "live", icon: FilePen },
  { label: "Page", value: "page", icon: FileText },
];

const fmtDate = (iso: string) => format(new Date(iso), "dd MMM yyyy");

export const DocumentItem = ({ document, depth = 0, onOpen, onCreate, onDelete }: Props) => {
  const [open, setOpen] = useState(true);
  const hasChildren = Boolean(document.children?.length);
  const Icon = hasChildren ? Folder : document.type === "live" ? FilePen : FileText;

  return (
    <>
      <div className="group hover:bg-muted/40 grid grid-cols-[1fr_180px_120px_120px] items-center border-t text-sm">
        <div className="flex min-w-0 items-center gap-2 py-2 pr-2" style={{ paddingLeft: 12 + depth * 24 }}>
          {hasChildren ? (
            <button
              onClick={() => setOpen((o) => !o)}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <Icon className="text-muted-foreground size-4 shrink-0" />
          <button onClick={() => onOpen(document.id)} className="truncate text-left hover:underline">
            {document.title || "Untitled"}
          </button>
          {document.status === "draft" && (
            <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
              Draft
            </span>
          )}
          <div className="ml-auto flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              onClick={() => onOpen(document.id)}
              title="Open"
              className="hover:bg-muted text-muted-foreground grid size-6 place-items-center rounded-xs"
            >
              <SquareArrowOutUpRight className="size-3.5" />
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  title="Create child content"
                  className="hover:bg-muted text-muted-foreground grid size-6 place-items-center rounded-xs"
                >
                  <Plus className="size-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-40 p-1">
                {CHILD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onCreate(opt.value, document.id);
                      setOpen(true);
                    }}
                    className="hover:bg-muted flex w-full items-center gap-2 rounded-xs px-2.5 py-1.5 text-sm"
                  >
                    <opt.icon className="size-4" />
                    {opt.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
            <button
              onClick={() => onDelete(document)}
              title="Delete"
              className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground grid size-6 place-items-center rounded-xs"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2 text-xs">
          {document.owner_name && (
            <span className="bg-brand grid size-5 shrink-0 place-items-center rounded-full text-[9px] font-medium text-white">
              {getInitials(document.owner_name)}
            </span>
          )}
          <span className="text-muted-foreground truncate">{document.owner_name ?? "—"}</span>
        </div>
        <div className="text-muted-foreground px-2 text-xs">{fmtDate(document.created_at)}</div>
        <div className="text-muted-foreground px-2 text-xs">{fmtDate(document.updated_at)}</div>
      </div>
      {hasChildren &&
        open &&
        document.children!.map((child) => (
          <DocumentItem
            key={child.id}
            document={child}
            depth={depth + 1}
            onOpen={onOpen}
            onCreate={onCreate}
            onDelete={onDelete}
          />
        ))}
    </>
  );
};
