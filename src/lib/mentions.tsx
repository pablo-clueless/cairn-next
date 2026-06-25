import { Fragment, type ReactNode } from "react";

/** Rich mention token the composer emits and the backend parses: @[Name](id). */
export const MENTION_RE = /@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)/g;

/** Build a mention token for a user. */
export const mentionToken = (name: string, id: string) => `@[${name}](${id})`;

/**
 * Detect an in-progress "@query" immediately before the caret: the text after
 * the last `@` that is on a word boundary and contains no whitespace. Returns
 * the query and the index of the `@`, or null when not mentioning.
 */
export function activeMentionQuery(
  text: string,
  caret: number,
): { query: string; at: number } | null {
  const upToCaret = text.slice(0, caret);
  const at = upToCaret.lastIndexOf("@");
  if (at === -1) return null;
  // The `@` must start a token (beginning of input or preceded by whitespace).
  if (at > 0 && !/\s/.test(upToCaret[at - 1])) return null;
  const query = upToCaret.slice(at + 1);
  if (/\s/.test(query)) return null;
  return { query, at };
}

/** Render a comment body, turning @[Name](id) tokens into styled mentions. */
export function renderMentionedBody(body: string): ReactNode {
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(MENTION_RE);
  let i = 0;
  while ((match = re.exec(body)) !== null) {
    if (match.index > last) nodes.push(<Fragment key={i++}>{body.slice(last, match.index)}</Fragment>);
    nodes.push(
      <span key={i++} className="text-brand font-medium">
        @{match[1]}
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < body.length) nodes.push(<Fragment key={i++}>{body.slice(last)}</Fragment>);
  return nodes;
}
