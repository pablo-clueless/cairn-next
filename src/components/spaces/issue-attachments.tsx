"use client";

import { useRef } from "react";
import { DownloadIcon, Loader2Icon, PaperclipIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/client";
import { formatRelativeTime } from "@/lib/string";
import {
  attachmentDownloadUrl,
  useAttachments,
  useDeleteAttachment,
  useUploadAttachment,
} from "@/hooks/use-attachments";
import { useUserStore } from "@/store";

interface IssueAttachmentsProps {
  slug: string;
  issueKey: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

export const IssueAttachments = ({ slug, issueKey }: IssueAttachmentsProps) => {
  const user = useUserStore((s) => s.user);
  const attachments = useAttachments(slug, issueKey);
  const upload = useUploadAttachment(slug, issueKey);
  const remove = useDeleteAttachment(slug, issueKey);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = (file: File | undefined) => {
    if (!file) return;
    upload.mutate(file, {
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const list = attachments.data ?? [];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">
          Attachments{list.length > 0 ? ` (${list.length})` : ""}
        </h2>
        <Button
          size="sm"
          variant="outline"
          disabled={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          {upload.isPending ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <PaperclipIcon className="size-3.5" />
          )}
          Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </div>

      {list.length === 0 ? (
        <p className="text-muted-foreground text-sm">No attachments.</p>
      ) : (
        <ul className="space-y-1.5">
          {list.map((att) => (
            <li key={att.id} className="flex items-center gap-2 text-sm">
              <PaperclipIcon className="text-muted-foreground size-3.5 shrink-0" />
              <a
                href={attachmentDownloadUrl(slug, att.id)}
                className="truncate hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {att.filename}
              </a>
              <span className="text-muted-foreground shrink-0 text-xs">
                {formatBytes(att.size_bytes)}
              </span>
              <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                {att.uploader_name ?? "—"} · {formatRelativeTime(att.created_at)}
              </span>
              <a
                href={attachmentDownloadUrl(slug, att.id)}
                className="text-muted-foreground hover:text-foreground shrink-0"
                aria-label="Download"
                target="_blank"
                rel="noopener noreferrer"
              >
                <DownloadIcon className="size-3.5" />
              </a>
              {user && att.uploaded_by === user.id && (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  disabled={remove.isPending}
                  aria-label="Delete attachment"
                  onClick={() =>
                    remove.mutate(att.id, {
                      onError: (error) => toast.error(getApiErrorMessage(error)),
                    })
                  }
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
