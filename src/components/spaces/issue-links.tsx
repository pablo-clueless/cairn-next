"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/client";
import { useCreateLink, useDeleteLink, useIssueLinks } from "@/hooks/use-issue-links";
import type { IssueLinkType, IssueLinkView } from "@/types";

interface IssueLinksProps {
  slug: string;
  issueKey: string;
}

const LINK_OPTIONS: { value: IssueLinkType; label: string }[] = [
  { value: "blocks", label: "blocks" },
  { value: "relates_to", label: "relates to" },
  { value: "duplicates", label: "duplicates" },
];

/** Human label for a link as seen from the current issue (direction-aware). */
function linkLabel(link: IssueLinkView): string {
  const { type, direction } = link;
  if (type === "relates_to") return "relates to";
  if (type === "blocks") return direction === "outward" ? "blocks" : "is blocked by";
  return direction === "outward" ? "duplicates" : "is duplicated by";
}

export const IssueLinks = ({ slug, issueKey }: IssueLinksProps) => {
  const links = useIssueLinks(slug, issueKey);
  const createLink = useCreateLink(slug, issueKey);
  const deleteLink = useDeleteLink(slug, issueKey);

  const [type, setType] = useState<IssueLinkType>("blocks");
  const [target, setTarget] = useState("");

  const submit = () => {
    const targetKey = target.trim().toUpperCase();
    if (!targetKey) return;
    createLink.mutate(
      { type, target_key: targetKey },
      {
        onSuccess: () => setTarget(""),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const list = links.data ?? [];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium">Linked issues</h2>

      {list.length > 0 && (
        <ul className="space-y-1.5">
          {list.map((link) => (
            <li key={link.id} className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground w-28 shrink-0 text-xs">{linkLabel(link)}</span>
              <Link
                href={`/org/${slug}/issues/${link.issue.key}`}
                className="font-mono text-xs hover:underline"
              >
                {link.issue.key}
              </Link>
              <span className="text-muted-foreground truncate">{link.issue.title}</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive ml-auto shrink-0"
                disabled={deleteLink.isPending}
                onClick={() =>
                  deleteLink.mutate(link.id, {
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  })
                }
                aria-label="Remove link"
              >
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Select value={type} onValueChange={(v) => setType(v as IssueLinkType)}>
          <SelectTrigger className="w-36 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LINK_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Issue key, e.g. ENG-12"
          className="font-mono"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button disabled={!target.trim() || createLink.isPending} onClick={submit}>
          {createLink.isPending && <Loader2Icon className="size-3.5 animate-spin" />}
          Link
        </Button>
      </div>
    </section>
  );
};
