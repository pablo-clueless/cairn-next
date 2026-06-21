import type { LucideIcon } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { useCallback } from "react";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BetweenHorizontalEndIcon,
  BetweenHorizontalStartIcon,
  BetweenVerticalEndIcon,
  BetweenVerticalStartIcon,
  BoldIcon,
  Columns2Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  HighlighterIcon,
  ImagePlusIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  Redo2Icon,
  RemoveFormattingIcon,
  Rows2Icon,
  StrikethroughIcon,
  SubscriptIcon,
  SuperscriptIcon,
  TableIcon,
  TextQuoteIcon,
  Trash2Icon,
  UnderlineIcon,
  Undo2Icon,
} from "lucide-react";

interface GroupConfig {
  label: string;
  buttons: ButtonConfig[];
}

interface ButtonConfig {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
}

interface ContextAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  danger?: boolean;
}

export const TABLE_CONTEXT_ACTIONS = (editor: Editor): ContextAction[][] => [
  [
    {
      label: "Insert Column Before",
      icon: BetweenVerticalStartIcon,
      onClick: () => editor.chain().focus().addColumnBefore().run(),
    },
    {
      label: "Insert Column After",
      icon: BetweenVerticalEndIcon,
      onClick: () => editor.chain().focus().addColumnAfter().run(),
    },
    {
      label: "Insert Row Above",
      icon: BetweenHorizontalStartIcon,
      onClick: () => editor.chain().focus().addRowBefore().run(),
    },
    {
      label: "Insert Row Below",
      icon: BetweenHorizontalEndIcon,
      onClick: () => editor.chain().focus().addRowAfter().run(),
    },
  ],
  [
    {
      label: "Delete Column",
      icon: Columns2Icon,
      onClick: () => editor.chain().focus().deleteColumn().run(),
      danger: true,
    },
    {
      label: "Delete Row",
      icon: Rows2Icon,
      onClick: () => editor.chain().focus().deleteRow().run(),
      danger: true,
    },
    {
      label: "Delete Table",
      icon: Trash2Icon,
      onClick: () => editor.chain().focus().deleteTable().run(),
      danger: true,
    },
  ],
];

export const EDITOR_BUTTON_GROUPS = (editor: Editor): GroupConfig[] => {
  const setLink = useCallback(() => {
    if (!editor) return;
    const url = editor.getAttributes("link").href;
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    try {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    } catch (error) {
      console.error({ error });
    }
  }, [editor]);

  const setImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        if (src) editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  return [
    {
      label: "history",
      buttons: [
        {
          label: "Undo",
          icon: Undo2Icon,
          onClick: () => editor.chain().focus().undo().run(),
          disabled: !editor.can().chain().focus().undo().run(),
        },
        {
          label: "Redo",
          icon: Redo2Icon,
          onClick: () => editor.chain().focus().redo().run(),
          disabled: !editor.can().chain().focus().redo().run(),
        },
        {
          label: "Clear Formatting",
          icon: RemoveFormattingIcon,
          onClick: () => editor.chain().focus().clearContent().run(),
        },
      ],
    },
    {
      label: "headings",
      buttons: [
        {
          label: "Heading 1",
          icon: Heading1Icon,
          onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          isActive: editor.isActive("heading", { level: 1 }),
        },
        {
          label: "Heading 2",
          icon: Heading2Icon,
          onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          isActive: editor.isActive("heading", { level: 2 }),
        },
        {
          label: "Heading 3",
          icon: Heading3Icon,
          onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          isActive: editor.isActive("heading", { level: 3 }),
        },
        {
          label: "Heading 4",
          icon: Heading4Icon,
          onClick: () => editor.chain().focus().toggleHeading({ level: 4 }).run(),
          isActive: editor.isActive("heading", { level: 4 }),
        },
        {
          label: "Heading 5",
          icon: Heading5Icon,
          onClick: () => editor.chain().focus().toggleHeading({ level: 5 }).run(),
          isActive: editor.isActive("heading", { level: 5 }),
        },
        {
          label: "Heading 6",
          icon: Heading6Icon,
          onClick: () => editor.chain().focus().toggleHeading({ level: 6 }).run(),
          isActive: editor.isActive("heading", { level: 6 }),
        },
        {
          label: "Paragraph",
          icon: PilcrowIcon,
          onClick: () => editor.chain().focus().setParagraph().run(),
          isActive: editor.isActive("paragraph"),
        },
      ],
    },
    {
      label: "text_style",
      buttons: [
        {
          label: "Bold",
          icon: BoldIcon,
          onClick: () => editor.chain().focus().toggleBold().run(),
          isActive: editor.isActive("bold"),
          disabled: !editor.can().chain().focus().toggleBold().run(),
        },
        {
          label: "Italic",
          icon: ItalicIcon,
          onClick: () => editor.chain().focus().toggleItalic().run(),
          isActive: editor.isActive("italic"),
          disabled: !editor.can().chain().focus().toggleItalic().run(),
        },
        {
          label: "Underline",
          icon: UnderlineIcon,
          onClick: () => editor.chain().focus().toggleUnderline().run(),
          isActive: editor.isActive("underline"),
          disabled: !editor.can().chain().focus().toggleUnderline().run(),
        },
        {
          label: "Strikethrough",
          icon: StrikethroughIcon,
          onClick: () => editor.chain().focus().toggleStrike().run(),
          isActive: editor.isActive("strike"),
          disabled: !editor.can().chain().focus().toggleStrike().run(),
        },
        {
          label: "Highlight",
          icon: HighlighterIcon,
          onClick: () => editor.chain().focus().toggleHighlight({ color: "#baba06" }).run(),
          isActive: editor.isActive("highlight"),
        },
        {
          label: "Subscript",
          icon: SubscriptIcon,
          onClick: () => editor.chain().focus().toggleSubscript().run(),
          isActive: editor.isActive("subscript"),
        },
        {
          label: "Superscript",
          icon: SuperscriptIcon,
          onClick: () => editor.chain().focus().toggleSuperscript().run(),
          isActive: editor.isActive("superscript"),
        },
      ],
    },
    {
      label: "insert",
      buttons: [
        {
          label: "Image",
          icon: ImagePlusIcon,
          onClick: setImage,
          isActive: editor.isActive("image"),
        },
        {
          label: "Link",
          icon: LinkIcon,
          onClick: () => setLink(),
          isActive: editor.isActive("link"),
          disabled: editor.isActive("link"),
        },
      ],
    },
    {
      label: "blocks",
      buttons: [
        {
          label: "Blockquote",
          icon: TextQuoteIcon,
          onClick: () => editor.chain().focus().toggleBlockquote().run(),
          isActive: editor.isActive("blockquote"),
        },
        {
          label: "Bullet List",
          icon: ListIcon,
          onClick: () => editor.chain().focus().toggleBulletList().run(),
          isActive: editor.isActive("bulletList"),
        },
        {
          label: "Ordered List",
          icon: ListOrderedIcon,
          onClick: () => editor.chain().focus().toggleOrderedList().run(),
          isActive: editor.isActive("orderedList"),
        },
      ],
    },
    {
      label: "table",
      buttons: [
        {
          label: "Table",
          icon: TableIcon,
          onClick: () =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
        },
        {
          label: "Column Left",
          icon: BetweenVerticalStartIcon,
          onClick: () => editor.chain().focus().addColumnBefore().run(),
        },
        {
          label: "Column Right",
          icon: BetweenVerticalEndIcon,
          onClick: () => editor.chain().focus().addColumnAfter().run(),
        },
        {
          label: "Delete Column",
          icon: Columns2Icon,
          onClick: () => editor.chain().focus().deleteColumn().run(),
        },
        {
          label: "Row Above",
          icon: BetweenHorizontalStartIcon,
          onClick: () => editor.chain().focus().addRowBefore().run(),
        },
        {
          label: "Row Below",
          icon: BetweenHorizontalEndIcon,
          onClick: () => editor.chain().focus().addRowAfter().run(),
        },
        {
          label: "Delete Below",
          icon: Rows2Icon,
          onClick: () => editor.chain().focus().deleteRow().run(),
        },
      ],
    },
    {
      label: "alignment",
      buttons: [
        {
          label: "Text Align Left",
          icon: AlignLeftIcon,
          onClick: () => editor.chain().focus().toggleTextAlign("left").run(),
          isActive: editor.isActive({ textAlign: "left" }),
        },
        {
          label: "Text Align Center",
          icon: AlignCenterIcon,
          onClick: () => editor.chain().focus().toggleTextAlign("center").run(),
          isActive: editor.isActive({ textAlign: "center" }),
        },
        {
          label: "Text Align Justify",
          icon: AlignJustifyIcon,
          onClick: () => editor.chain().focus().toggleTextAlign("justify").run(),
          isActive: editor.isActive({ textAlign: "justify" }),
        },
        {
          label: "Text Align Right",
          icon: AlignRightIcon,
          onClick: () => editor.chain().focus().toggleTextAlign("right").run(),
          isActive: editor.isActive({ textAlign: "right" }),
        },
      ],
    },
  ];
};
