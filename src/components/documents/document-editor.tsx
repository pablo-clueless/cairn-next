"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useDocument, useUpdateDocument } from "@/hooks/use-documents";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { TextEditor } from "../shared/rich-text-editor";
import { getApiErrorMessage } from "@/lib/client";
import { getInitials } from "@/lib/string";
import type { IDocument } from "@/types";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

/**
 * Inner editor for a loaded document. Mounted with `key={doc.id}` so its local
 * state initializes straight from props (no effect-driven sync needed).
 */
const EditorBody = ({
  slug,
  spaceKey,
  doc,
  onClose,
}: {
  slug: string;
  spaceKey: string;
  doc: IDocument;
  onClose: () => void;
}) => {
  const updateDocument = useUpdateDocument(slug, spaceKey);
  const [title, setTitle] = useState(doc.title);
  const [content, setContent] = useState(doc.content);

  const save = (status?: "published") =>
    updateDocument.mutate(
      { id: doc.id, update: { title: title.trim(), content, ...(status ? { status } : {}) } },
      {
        onSuccess: () => {
          toast.success(status === "published" ? "Published" : "Saved");
          onClose();
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );

  return (
    <>
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          {doc.status === "draft" && (
            <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
              Draft
            </span>
          )}
          <span className="text-muted-foreground text-xs capitalize">
            {doc.type === "live" ? "Live doc" : "Page"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => save(doc.status === "draft" ? "published" : undefined)}
            disabled={updateDocument.isPending}
          >
            {doc.status === "draft" ? "Publish" : "Save"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => save()} disabled={updateDocument.isPending}>
            Close
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give this page a title"
            className={cn(
              "w-full border-none bg-transparent text-3xl font-semibold outline-none",
              "placeholder:text-muted-foreground/50",
            )}
          />
          {doc.owner_name && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <span className="bg-brand grid size-6 place-items-center rounded-full text-[10px] font-medium text-white">
                {getInitials(doc.owner_name)}
              </span>
              By {doc.owner_name}
            </div>
          )}
          <TextEditor
            editable
            value={content}
            initialValue={doc.content}
            onValueChange={setContent}
            className="border-none shadow-none focus-within:shadow-none focus-within:ring-0"
            editorClassName="min-h-[50vh]"
          />
        </div>
      </div>
    </>
  );
};

interface Props {
  slug: string;
  spaceKey: string;
  documentId: string | null;
  onClose: () => void;
}

/**
 * Full-screen Confluence-style editor for a single document. The document is
 * created first (so it appears in the tree as a draft); this edits its title and
 * content, and Publish flips a draft to published.
 */
export const DocumentEditor = ({ slug, spaceKey, documentId, onClose }: Props) => {
  const doc = useDocument(slug, documentId);

  return (
    <Dialog open={Boolean(documentId)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1080px)]"
      >
        <DialogTitle className="sr-only">Edit document</DialogTitle>
        {doc.isLoading || !doc.data ? (
          <div className="grid flex-1 place-items-center">
            <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
          </div>
        ) : (
          <EditorBody key={doc.data.id} slug={slug} spaceKey={spaceKey} doc={doc.data} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
};
