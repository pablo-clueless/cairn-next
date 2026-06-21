"use client";

import { BulletList, ListItem, OrderedList } from "@tiptap/extension-list";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { TableCell, TableKit } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import Superscript from "@tiptap/extension-superscript";
import Blockquote from "@tiptap/extension-blockquote";
import Strikethrough from "@tiptap/extension-strike";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Paragraph from "@tiptap/extension-paragraph";
import Subscript from "@tiptap/extension-subscript";
import Underline from "@tiptap/extension-underline";
import { useEffect, useRef, useState } from "react";
import Document from "@tiptap/extension-document";
import Heading from "@tiptap/extension-heading";
import Italic from "@tiptap/extension-italic";
import { UndoRedo } from "@tiptap/extensions";
import Image from "@tiptap/extension-image";
import Bold from "@tiptap/extension-bold";
import Text from "@tiptap/extension-text";
import Link from "@tiptap/extension-link";
import { TableIcon } from "lucide-react";

import { EDITOR_BUTTON_GROUPS, TABLE_CONTEXT_ACTIONS } from "@/config/editor";
import type { Maybe } from "@/types";
import { cn } from "@/lib/utils";

const HeadingDropdown = ({ editor }: { editor: Editor }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeHeading = [1, 2, 3, 4, 5, 6].find((l) => editor.isActive("heading", { level: l }));
  const label = activeHeading ? `H${activeHeading}` : "¶";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className="hover:bg-muted active:bg-accent text-foreground flex h-7 min-w-8 items-center justify-center rounded px-1.5 text-xs font-semibold transition-colors"
        onClick={() => setOpen((v) => !v)}
        title="Heading"
        type="button"
      >
        {label}
        <svg
          className="ml-0.5 size-2.5 opacity-50"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 10 10"
        >
          <path d="M2 3.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="border-border bg-card absolute top-full left-0 z-50 mt-1 flex flex-col overflow-hidden rounded-md border shadow-lg">
          {[
            { level: 1, label: "Heading 1", size: "text-base font-bold" },
            { level: 2, label: "Heading 2", size: "text-sm font-bold" },
            { level: 3, label: "Heading 3", size: "text-sm font-semibold" },
            { level: 4, label: "Heading 4", size: "text-xs font-semibold" },
            { level: 5, label: "Heading 5", size: "text-xs font-medium" },
            { level: 6, label: "Heading 6", size: "text-xs" },
            { level: 0, label: "Paragraph", size: "text-xs text-muted-foreground" },
          ].map(({ level, label, size }) => (
            <button
              className={cn(
                "hover:bg-muted flex items-center gap-2 px-3 py-1.5 text-left whitespace-nowrap transition-colors",
                size,
                (level === 0
                  ? editor.isActive("paragraph")
                  : editor.isActive("heading", { level })) && "bg-muted text-foreground",
              )}
              key={label}
              onClick={() => {
                if (level === 0) {
                  editor.chain().focus().setParagraph().run();
                } else {
                  editor
                    .chain()
                    .focus()
                    .toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 })
                    .run();
                }
                setOpen(false);
              }}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AlignmentGroup = ({ editor }: { editor: Editor }) => {
  const groups = EDITOR_BUTTON_GROUPS(editor);
  const alignmentGroup = groups.find((g) => g.label === "alignment");
  if (!alignmentGroup) return null;

  return (
    <div className="border-border flex items-center overflow-hidden rounded border">
      {alignmentGroup.buttons.map((btn) => (
        <button
          className={cn(
            "flex h-7 w-7 items-center justify-center transition-colors",
            btn.isActive ? "bg-foreground text-background" : "text-foreground hover:bg-muted",
          )}
          key={btn.label}
          onClick={btn.onClick}
          title={btn.label}
          type="button"
        >
          <btn.icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
};

const TableContextMenu = ({ editor }: { editor: Editor }) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const inTable = target.closest("table");
      if (!inTable) return;

      e.preventDefault();
      setPos({ x: e.clientX, y: e.clientY });
    };

    const editorEl = editor.view.dom;
    editorEl.addEventListener("contextmenu", handleContextMenu);
    return () => editorEl.removeEventListener("contextmenu", handleContextMenu);
  }, [editor]);

  useEffect(() => {
    if (!pos) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setPos(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pos]);

  if (!pos) return null;

  const actions = TABLE_CONTEXT_ACTIONS(editor);

  return (
    <div
      className="border-border bg-card fixed z-100 min-w-45 overflow-hidden rounded-lg border shadow-xl"
      ref={menuRef}
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="border-border border-b px-3 py-1.5">
        <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
          Table
        </span>
      </div>
      {actions.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && <div className="bg-border mx-2 my-1 h-px" />}
          {group.map((action) => (
            <button
              className={cn(
                "hover:bg-muted flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs transition-colors",
                action.danger && "text-destructive hover:bg-destructive/10",
              )}
              key={action.label}
              onClick={() => {
                action.onClick();
                setPos(null);
              }}
              type="button"
            >
              <action.icon className="size-3.5 shrink-0" />
              {action.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

const TopBar = ({ editor }: { editor: Maybe<Editor> }) => {
  if (!editor) return null;

  const groups = EDITOR_BUTTON_GROUPS(editor);
  const textStyleGroup = groups.find((g) => g.label === "text_style");
  const historyGroup = groups.find((g) => g.label === "history");
  const insertGroup = groups.find((g) => g.label === "insert");
  const blocksGroup = groups.find((g) => g.label === "blocks");

  return (
    <div className="tiptap-btn-container border-border bg-card flex flex-wrap items-center gap-1.5 border-b px-3 py-2">
      {historyGroup && (
        <div className="flex items-center gap-0.5">
          {historyGroup.buttons.map((btn) => (
            <button
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded transition-colors",
                btn.disabled
                  ? "cursor-not-allowed opacity-40"
                  : "hover:bg-muted active:bg-accent text-foreground",
              )}
              disabled={btn.disabled}
              key={btn.label}
              onClick={btn.onClick}
              title={btn.label}
              type="button"
            >
              <btn.icon className="size-3.5" />
            </button>
          ))}
        </div>
      )}
      <div className="bg-border h-4 w-px" />
      <HeadingDropdown editor={editor} />
      <div className="bg-border h-4 w-px" />
      {textStyleGroup && (
        <div className="flex items-center gap-0.5">
          {textStyleGroup.buttons.map((btn) => (
            <button
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded transition-colors",
                btn.disabled ? "cursor-not-allowed opacity-40" : "",
                btn.isActive
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-muted active:bg-accent",
              )}
              disabled={btn.disabled}
              key={btn.label}
              onClick={btn.onClick}
              title={btn.label}
              type="button"
            >
              <btn.icon className="size-3.5" />
            </button>
          ))}
        </div>
      )}
      <div className="bg-border h-4 w-px" />
      <AlignmentGroup editor={editor} />
      <div className="bg-border h-4 w-px" />
      {blocksGroup && (
        <div className="flex items-center gap-0.5">
          {blocksGroup.buttons.map((btn) => (
            <button
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded transition-colors",
                btn.isActive
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-muted active:bg-accent",
              )}
              key={btn.label}
              onClick={btn.onClick}
              title={btn.label}
              type="button"
            >
              <btn.icon className="size-3.5" />
            </button>
          ))}
        </div>
      )}
      <div className="bg-border h-4 w-px" />
      {insertGroup && (
        <div className="flex items-center gap-0.5">
          {insertGroup.buttons.map((btn) => (
            <button
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded transition-colors",
                btn.disabled ? "cursor-not-allowed opacity-40" : "",
                btn.isActive
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-muted active:bg-accent",
              )}
              disabled={btn.disabled}
              key={btn.label}
              onClick={btn.onClick}
              title={btn.label}
              type="button"
            >
              <btn.icon className="size-3.5" />
            </button>
          ))}
        </div>
      )}
      <div className="bg-border h-4 w-px" />
      <button
        className="text-foreground hover:bg-muted active:bg-accent flex h-7 w-7 items-center justify-center rounded transition-colors"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        title="Insert Table (right-click inside table for options)"
        type="button"
      >
        <TableIcon className="size-4" />
      </button>
    </div>
  );
};

const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-background-color"),
        renderHTML: (attributes) => ({
          "data-background-color": attributes.backgroundColor,
          style: `background-color: ${attributes.backgroundColor}`,
        }),
      },
    };
  },
});

const extensions = [
  Blockquote,
  Bold,
  BulletList,
  Color,
  CustomTableCell,
  Document,
  Heading,
  Highlight.configure({ multicolor: true }),
  Image,
  Italic,
  Link.configure({
    openOnClick: true,
    autolink: true,
    defaultProtocol: "https",
    protocols: ["http", "https"],
    isAllowedUri: (url, ctx) => {
      try {
        const parsedUrl = url.includes(":")
          ? new URL(url)
          : new URL(`${ctx.defaultProtocol}://${url}`);
        if (!ctx.defaultValidate(parsedUrl.href)) return false;
        const disallowedProtocols = ["ftp", "file", "mailto", "tel"];
        const protocol = parsedUrl.protocol.replace(":", "");
        if (disallowedProtocols.includes(protocol)) return false;
        const allowedProtocols = ctx.protocols.map((p) => (typeof p === "string" ? p : p.scheme));
        if (!allowedProtocols.includes(protocol)) return false;
        const disallowedDomains = ["example-phishing.com", "malicious-site.net"];
        if (disallowedDomains.includes(parsedUrl.hostname)) return false;
        return true;
      } catch {
        return false;
      }
    },
    shouldAutoLink: (url) => {
      try {
        const parsedUrl = url.includes(":") ? new URL(url) : new URL(`https://${url}`);
        return ![""].includes(parsedUrl.hostname);
      } catch {
        return false;
      }
    },
  }),
  ListItem,
  OrderedList,
  Paragraph,
  Placeholder.configure({ placeholder: "Start typing here..." }),
  Strikethrough,
  Subscript,
  Superscript,
  TableKit.configure({
    table: { resizable: true },
    tableCell: false,
  }),
  Text,
  TextAlign.configure({
    alignments: ["center", "justify", "left", "right"],
    types: ["heading", "paragraph"],
  }),
  TextStyle,
  Underline,
  UndoRedo,
];

interface Props {
  onValueChange: (value: string) => void;
  value: string;
  className?: string;
  editorClassName?: string;
  initialValue?: string;
  editable?: boolean;
}

export const TextEditor = ({
  onValueChange,
  value,
  className,
  editable,
  editorClassName,
  initialValue,
}: Props) => {
  const editor = useEditor({
    extensions,
    content: initialValue || value,
    editable,
    onUpdate: ({ editor }) => {
      onValueChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose dark:prose-invert prose-sm w-full prose-p:text-sm prose-p:leading-relaxed prose-headings:font-semibold prose-li:list-disc prose-li:list-outside prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:pl-4 prose-blockquote:text-muted-foreground focus:outline-none min-h-28",
          editorClassName,
          !editable && "opacity-60",
        ),
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    const div = document.createElement("div");
    div.innerHTML = value;
    if (editor.getHTML() === div.innerHTML) return;
    editor.commands.setContent(value, {});
  }, [value, editor]);

  return (
    <div
      className={cn(
        "border-border focus-within:ring-ring flex w-full flex-col overflow-hidden rounded-lg border shadow-sm transition-all focus-within:shadow-md focus-within:ring-1",
        className,
        !editable && "bg-muted/30",
      )}
    >
      {editable && <TopBar editor={editor} />}
      {editable && editor && <TableContextMenu editor={editor} />}
      <EditorContent
        editor={editor}
        className={cn(
          "editor text-foreground h-full overflow-y-auto px-4 py-3 text-sm leading-relaxed",
          !editable && "cursor-not-allowed",
        )}
      />
    </div>
  );
};
