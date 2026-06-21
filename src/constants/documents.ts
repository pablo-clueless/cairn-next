import { File, FileText, Folder, Presentation } from "lucide-react";

export const DOCUMENT_TYPES = [
  { label: "All", value: "all", icon: File },
  { label: "Page and Live doc", value: "page", icon: FileText },
  { label: "Whiteboard", value: "whiteboard", icon: Presentation },
  { label: "Folder", value: "folder", icon: Folder },
];

export const DOCUMENT_SORTS = [
  { label: "Tree (default)", value: "tree" },
  { label: "Title - A to Z", value: "title" },
];
