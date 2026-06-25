"use client";

import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/client";
import { useUnwatchIssue, useWatchIssue, useWatchers } from "@/hooks/use-watchers";
import { useUserStore } from "@/store";

interface IssueWatchButtonProps {
  slug: string;
  issueKey: string;
}

export const IssueWatchButton = ({ slug, issueKey }: IssueWatchButtonProps) => {
  const user = useUserStore((s) => s.user);
  const watchers = useWatchers(slug, issueKey);
  const watch = useWatchIssue(slug, issueKey);
  const unwatch = useUnwatchIssue(slug, issueKey);

  const list = watchers.data ?? [];
  const isWatching = Boolean(user && list.some((wch) => wch.user_id === user.id));
  const pending = watch.isPending || unwatch.isPending;

  const toggle = () => {
    const onError = (error: unknown) => toast.error(getApiErrorMessage(error));
    if (isWatching) {
      if (user) unwatch.mutate(user.id, { onError });
    } else {
      watch.mutate(undefined, { onError });
    }
  };

  return (
    <Button variant="outline" className="w-full justify-start" disabled={pending} onClick={toggle}>
      {pending ? (
        <Loader2Icon className="size-3.5 animate-spin" />
      ) : isWatching ? (
        <EyeOffIcon className="size-3.5" />
      ) : (
        <EyeIcon className="size-3.5" />
      )}
      {isWatching ? "Watching" : "Watch"}
      {list.length > 0 && <span className="text-muted-foreground ml-auto text-xs">{list.length}</span>}
    </Button>
  );
};
