"use client";

import { useEffect, useState } from "react";
import { useQueryClient, type Query } from "@tanstack/react-query";

import { WebsocketClient } from "@/lib/websocket";

export interface PresenceUser {
  id: string;
  name: string;
}

interface PresencePayload {
  room: string;
  users: PresenceUser[];
}

/** Events the server pushes to the client. */
type IncomingEvents = {
  "comment.created": unknown;
  "comment.updated": unknown;
  "comment.deleted": unknown;
  "issue.updated": unknown;
  presence: PresencePayload;
};

/** Events the client emits to the server (room join/leave). */
type OutgoingEvents = {
  join: string;
  leave: string;
};

const socketUrl = () =>
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

/**
 * Live-sync an open issue: joins the issue's realtime room, invalidates the
 * comment/activity/issue queries when others change them, and reports who else
 * is viewing (presence). Returns the list of co-viewers.
 */
export function useIssueRealtime(slug: string, issueKey: string, issueId: string | undefined) {
  const qc = useQueryClient();
  const [viewers, setViewers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!issueId) return;
    const room = `issue:${issueId}`;
    const commentsUrl = `/v1/orgs/${slug}/issues/${issueKey}/comments`;
    const activityUrl = `/v1/orgs/${slug}/issues/${issueKey}/activity`;
    const issueUrl = `/v1/orgs/${slug}/issues/${issueKey}`;

    const ws = new WebsocketClient<IncomingEvents, OutgoingEvents>(socketUrl(), {
      withCredentials: true,
    });
    const matchUrl = (url: string) => (q: Query) => q.queryKey[0] === url;

    const offConnect = ws.on("connect", () => ws.publish("join", room));
    const refreshComments = () => {
      qc.invalidateQueries({ predicate: matchUrl(commentsUrl) });
      qc.invalidateQueries({ predicate: matchUrl(activityUrl) });
    };
    const offCreated = ws.subscribe("comment.created", refreshComments);
    const offUpdated = ws.subscribe("comment.updated", refreshComments);
    const offDeleted = ws.subscribe("comment.deleted", refreshComments);
    const offIssue = ws.subscribe("issue.updated", () => {
      qc.invalidateQueries({ predicate: matchUrl(issueUrl) });
      qc.invalidateQueries({ predicate: matchUrl(activityUrl) });
    });
    const offPresence = ws.subscribe("presence", (payload) => {
      if (payload.room === room) setViewers(payload.users ?? []);
    });

    ws.connect();
    // If already connected before the listener attached, join immediately.
    if (ws.connected) ws.publish("join", room);

    return () => {
      offConnect();
      offCreated();
      offUpdated();
      offDeleted();
      offIssue();
      offPresence();
      if (ws.connected) ws.publish("leave", room);
      ws.disconnect();
    };
  }, [slug, issueKey, issueId, qc]);

  return viewers;
}
