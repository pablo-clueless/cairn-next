"use client";

import { CheckIcon, CloudIcon, Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useDocument, useUpdateDocument } from "@/hooks/use-documents";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { TextEditor } from "../shared/rich-text-editor";
import { getApiErrorMessage } from "@/lib/client";
import { getInitials } from "@/lib/string";
import type { IDocument } from "@/types";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

/** How long after the last keystroke before an autosave fires. */
const AUTOSAVE_DELAY_MS = 1000;

type SaveState = "saved" | "unsaved" | "saving";

const SaveStatus = ({ state }: { state: SaveState }) => {
  if (state === "saving") {
    return (
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Loader2Icon className="size-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (state === "unsaved") {
    return (
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <CloudIcon className="size-3" /> Unsaved changes
      </span>
    );
  }
  return (
    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <CheckIcon className="size-3" /> Saved
    </span>
  );
};

/**
 * Inner editor for a loaded document. Mounted with `key={doc.id}` so its local
 * state initializes straight from props (no effect-driven sync needed).
 *
 * Live docs autosave: edits to title/content are debounced and PATCHed without
 * leaving the editor. Publish (drafts) and Close remain explicit.
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
  const [saveState, setSaveState] = useState<SaveState>("saved");

  // `mutate` is stable across renders; ref keeps our callbacks dependency-free
  // so the autosave effect isn't re-armed every time mutation state flips.
  const mutateRef = useRef(updateDocument.mutate);
  mutateRef.current = updateDocument.mutate;

  // Last values successfully persisted, seeded from the loaded doc.
  const savedRef = useRef({ title: doc.title.trim(), content: doc.content });
  // Latest edited values, reachable from timers / unmount without re-arming.
  const latest = useRef({ title, content });
  latest.current = { title, content };

  const isDirty = useCallback(() => {
    const t = latest.current.title.trim();
    return t !== savedRef.current.title || latest.current.content !== savedRef.current.content;
  }, []);

  /** PATCH the current snapshot. `status` is only sent on explicit publish. */
  const persist = useCallback(
    (status?: "published") =>
      new Promise<boolean>((resolve) => {
        const snapshot = { title: latest.current.title.trim(), content: latest.current.content };
        setSaveState("saving");
        mutateRef.current(
          { id: doc.id, update: { ...snapshot, ...(status ? { status } : {}) } },
          {
            onSuccess: () => {
              savedRef.current = snapshot;
              setSaveState(isDirty() ? "unsaved" : "saved");
              resolve(true);
            },
            onError: (e) => {
              setSaveState("unsaved");
              toast.error(getApiErrorMessage(e));
              resolve(false);
            },
          },
        );
      }),
    [doc.id, isDirty],
  );

  // Debounced autosave: re-arms on each edit, fires once typing settles.
  useEffect(() => {
    if (!isDirty()) return;
    setSaveState("unsaved");
    const timer = setTimeout(() => void persist(), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [title, content, isDirty, persist]);

  // Best-effort flush of any pending edit when the editor unmounts.
  useEffect(
    () => () => {
      if (isDirty()) {
        mutateRef.current({
          id: doc.id,
          update: { title: latest.current.title.trim(), content: latest.current.content },
        });
      }
    },
    [doc.id, isDirty],
  );

  const publish = async () => {
    if (await persist("published")) {
      toast.success("Published");
      onClose();
    }
  };

  const closeEditor = async () => {
    if (isDirty()) await persist();
    onClose();
  };

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
        <div className="flex items-center gap-3">
          <SaveStatus state={saveState} />
          {doc.status === "draft" && (
            <Button size="sm" onClick={publish} disabled={updateDocument.isPending}>
              Publish
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={closeEditor} disabled={updateDocument.isPending}>
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
