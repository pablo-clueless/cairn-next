"use client";

import { useRef, useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/string";
import { activeMentionQuery, mentionToken } from "@/lib/mentions";

export interface MentionMember {
  user_id: string;
  name: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  members: MentionMember[];
  placeholder?: string;
  rows?: number;
  className?: string;
  /** Fired on ⌘/Ctrl+Enter (and only when the mention menu is closed). */
  onSubmit?: () => void;
}

/**
 * A textarea with @mention autocomplete. Typing `@` opens a member picker;
 * selecting one inserts an `@[Name](id)` token that the backend parses.
 */
export const MentionTextarea = ({
  value,
  onChange,
  members,
  placeholder,
  rows = 3,
  className,
  onSubmit,
}: MentionTextareaProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [mention, setMention] = useState<{ query: string; at: number } | null>(null);
  const [highlight, setHighlight] = useState(0);

  const matches = mention
    ? members
        .filter((m) => m.name.toLowerCase().includes(mention.query.toLowerCase()))
        .slice(0, 6)
    : [];
  const menuOpen = matches.length > 0;

  const syncMention = (text: string, caret: number) => {
    setMention(activeMentionQuery(text, caret));
    setHighlight(0);
  };

  const insert = (member: MentionMember) => {
    if (!mention) return;
    const el = ref.current;
    const caret = el?.selectionStart ?? value.length;
    const before = value.slice(0, mention.at);
    const after = value.slice(caret);
    const token = mentionToken(member.name, member.user_id) + " ";
    const next = before + token + after;
    onChange(next);
    setMention(null);
    // Restore caret just past the inserted token.
    requestAnimationFrame(() => {
      if (!el) return;
      const pos = (before + token).length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="relative">
      <Textarea
        ref={ref}
        rows={rows}
        value={value}
        placeholder={placeholder}
        className={className}
        onChange={(e) => {
          onChange(e.target.value);
          syncMention(e.target.value, e.target.selectionStart ?? e.target.value.length);
        }}
        onClick={(e) => syncMention(value, e.currentTarget.selectionStart ?? 0)}
        onKeyDown={(e) => {
          if (menuOpen) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => (h + 1) % matches.length);
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => (h - 1 + matches.length) % matches.length);
              return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              insert(matches[highlight]);
              return;
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setMention(null);
              return;
            }
          }
          if (onSubmit && (e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      {menuOpen && (
        <ul className="bg-popover absolute bottom-full z-20 mb-1 w-64 overflow-hidden rounded-md border shadow-md">
          {matches.map((m, i) => (
            <li key={m.user_id}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm",
                  i === highlight ? "bg-accent" : "hover:bg-accent",
                )}
                onMouseEnter={() => setHighlight(i)}
                // onMouseDown (not onClick) so it fires before the textarea blur.
                onMouseDown={(e) => {
                  e.preventDefault();
                  insert(m);
                }}
              >
                <Avatar className="size-5">
                  <AvatarFallback className="text-[8px]">{getInitials(m.name)}</AvatarFallback>
                </Avatar>
                {m.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
