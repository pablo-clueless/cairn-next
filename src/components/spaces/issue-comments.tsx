"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/client";
import { formatRelativeTime, getInitials } from "@/lib/string";
import { renderMentionedBody } from "@/lib/mentions";
import { MentionTextarea, type MentionMember } from "@/components/spaces/mention-textarea";
import { useMembers } from "@/hooks/use-orgs";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from "@/hooks/use-comments";
import { useUserStore } from "@/store";
import type { Comment } from "@/types";

interface IssueCommentsProps {
  slug: string;
  issueKey: string;
}

export const IssueComments = ({ slug, issueKey }: IssueCommentsProps) => {
  const comments = useComments(slug, issueKey);
  const createComment = useCreateComment(slug, issueKey);
  const membersQuery = useMembers(slug);
  const members: MentionMember[] = membersQuery.data ?? [];
  const [body, setBody] = useState("");

  const submit = () => {
    const value = body.trim();
    if (!value) return;
    createComment.mutate(
      { body: value },
      {
        onSuccess: () => setBody(""),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const list = comments.data ?? [];

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium">
        Comments{list.length > 0 ? ` (${list.length})` : ""}
      </h2>

      <MentionTextarea
        value={body}
        onChange={setBody}
        members={members}
        rows={3}
        placeholder="Add a comment… use @ to mention someone"
        onSubmit={submit}
      />
      <div className="flex justify-end">
        <Button disabled={!body.trim() || createComment.isPending} onClick={submit}>
          {createComment.isPending && <Loader2Icon className="size-3.5 animate-spin" />}
          Comment
        </Button>
      </div>

      {comments.isLoading ? (
        <div className="grid place-items-center py-6">
          <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <p className="text-muted-foreground text-sm">No comments yet.</p>
      ) : (
        <ul className="space-y-4">
          {list.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              slug={slug}
              issueKey={issueKey}
              members={members}
            />
          ))}
        </ul>
      )}
    </section>
  );
};

interface CommentRowProps {
  comment: Comment;
  slug: string;
  issueKey: string;
  members: MentionMember[];
}

const CommentRow = ({ comment, slug, issueKey, members }: CommentRowProps) => {
  const user = useUserStore((s) => s.user);
  const updateComment = useUpdateComment(slug, issueKey);
  const deleteComment = useDeleteComment(slug, issueKey);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);

  const isAuthor = Boolean(user && comment.author_id === user.id);
  const edited = comment.updated_at !== comment.created_at;

  const save = () => {
    const value = draft.trim();
    if (!value) return;
    updateComment.mutate(
      { id: comment.id, update: { body: value } },
      {
        onSuccess: () => setEditing(false),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const remove = () => {
    if (!window.confirm("Delete this comment?")) return;
    deleteComment.mutate(comment.id, {
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  return (
    <li className="flex gap-3">
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="text-[10px]">
          {getInitials(comment.author_name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{comment.author_name}</span>
          <span className="text-muted-foreground text-xs">
            {formatRelativeTime(comment.created_at)}
            {edited ? " · edited" : ""}
          </span>
        </div>

        {editing ? (
          <div className="space-y-2">
            <MentionTextarea value={draft} onChange={setDraft} members={members} rows={3} onSubmit={save} />
            <div className="flex gap-2">
              <Button size="sm" disabled={!draft.trim() || updateComment.isPending} onClick={save}>
                {updateComment.isPending && <Loader2Icon className="size-3.5 animate-spin" />}
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setDraft(comment.body);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{renderMentionedBody(comment.body)}</p>
        )}

        {isAuthor && !editing && (
          <div className="flex gap-3 pt-0.5">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-xs"
              onClick={() => {
                setDraft(comment.body);
                setEditing(true);
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-destructive text-xs"
              disabled={deleteComment.isPending}
              onClick={remove}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </li>
  );
};
