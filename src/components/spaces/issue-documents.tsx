"use client";

import { FilePen, FileText, Loader2Icon, Plus, Presentation } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { DOCUMENT_SORTS, DOCUMENT_TYPES } from "@/constants/documents";
import { DocumentEditor, DocumentItem } from "../documents";
import type { DocumentType, IDocument } from "@/types";
import { getApiErrorMessage } from "@/lib/client";
import { useValues } from "@/hooks/use-values";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  buildDocumentTree,
  useCreateDocument,
  useDeleteDocument,
  useDocuments,
} from "@/hooks/use-documents";

const CREATE_OPTIONS: { label: string; value: DocumentType; icon: typeof FilePen }[] = [
  { label: "Live doc", value: "live", icon: FilePen },
  { label: "Page", value: "page", icon: FileText },
  { label: "Whiteboard", value: "whiteboard", icon: Presentation },
];

export const IssueDocuments = ({ slug, spaceKey }: { slug: string; spaceKey: string }) => {
  const { onValueChange, values } = useValues({ search: "", sort: "", type: "" });
  const [editorId, setEditorId] = useState<string | null>(null);
  const createDocument = useCreateDocument(slug, spaceKey);
  const deleteDocument = useDeleteDocument(slug, spaceKey);
  const [createOpen, setCreateOpen] = useState(false);
  const documents = useDocuments(slug, spaceKey);

  const all = documents.data ?? [];
  const parentIds = new Set(all.filter((d) => d.parent_id).map((d) => d.parent_id));

  const q = values.search.trim().toLowerCase();
  const matchesType = (d: IDocument) => {
    switch (values.type) {
      case "page":
        return d.type === "page" || d.type === "live";
      case "whiteboard":
        return d.type === "whiteboard";
      case "folder":
        return parentIds.has(d.id);
      default:
        return true;
    }
  };
  const filtered = all.filter((d) => matchesType(d) && (!q || d.title.toLowerCase().includes(q)));

  // "Tree" (default) nests by parent; "Title" flattens and sorts alphabetically.
  const rows =
    values.sort === "title"
      ? [...filtered].sort((a, b) => (a.title || "Untitled").localeCompare(b.title || "Untitled"))
      : buildDocumentTree(filtered);

  const handleCreate = (type: DocumentType, parentId?: string) => {
    setCreateOpen(false);
    createDocument.mutate(
      { type, parent_id: parentId ?? null, title: "" },
      {
        onSuccess: (doc) => setEditorId(doc.id),
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );
  };

  const handleDelete = (doc: IDocument) => {
    const childNote = doc.children?.length ? " and all its child documents" : "";
    if (!window.confirm(`Delete "${doc.title || "Untitled"}"${childNote}?`)) return;
    deleteDocument.mutate(doc.id, {
      onSuccess: () => toast.success("Document deleted"),
      onError: (e) => toast.error(getApiErrorMessage(e)),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-x-4">
        <Input
          className="w-48"
          onChange={(e) => onValueChange("search", e.target.value)}
          placeholder="Search documents"
          type="search"
          value={values.search}
        />
        <Select onValueChange={(value) => onValueChange("type", value)} value={values.type}>
          <SelectTrigger className="w-40 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="text-xs">
            {DOCUMENT_TYPES.map((type) => (
              <SelectItem className="text-xs" key={type.value} value={type.value}>
                <type.icon className="size-4" />
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => onValueChange("sort", value)} value={values.sort}>
          <SelectTrigger className="w-32 text-xs">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="text-xs">
            {DOCUMENT_SORTS.map((sort) => (
              <SelectItem className="text-xs" key={sort.value} value={sort.value}>
                {sort.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-hidden rounded-xs border">
        <div className="bg-muted text-muted-foreground grid grid-cols-[1fr_180px_120px_120px] text-xs font-medium">
          <div className="py-2 pl-3">Title</div>
          <div className="px-2 py-2">Owner</div>
          <div className="px-2 py-2">Created</div>
          <div className="px-2 py-2">Last updated</div>
        </div>
        {documents.isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
          </div>
        ) : rows.length > 0 ? (
          rows.map((doc) => (
            <DocumentItem
              key={doc.id}
              document={doc}
              onOpen={setEditorId}
              onCreate={handleCreate}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="text-muted-foreground border-t border-dashed py-12 text-center text-sm">
            No documents yet. Create a page or live doc to get started.
          </div>
        )}
        <div className="flex items-center border-t p-2">
          <Popover open={createOpen} onOpenChange={setCreateOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" disabled={createDocument.isPending}>
                <Plus className="size-4" /> Create
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-40 gap-1 p-1">
              {CREATE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleCreate(option.value)}
                  className="hover:bg-muted flex w-full items-center gap-2 rounded-xs px-2.5 py-1.5 text-sm"
                >
                  <option.icon className="size-4" />
                  {option.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <DocumentEditor
        slug={slug}
        spaceKey={spaceKey}
        documentId={editorId}
        onClose={() => setEditorId(null)}
      />
    </div>
  );
};
