export type DocumentType = "page" | "live" | "whiteboard";
export type DocumentStatus = "draft" | "published";

/** A document (page or live doc) within a space. Documents form a tree via parent_id. */
export interface IDocument {
  id: string;
  organization_id: string;
  space_id: string;
  parent_id: string | null;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  content: string;
  owner_id: string | null;
  owner_name: string | null;
  created_at: string;
  updated_at: string;
  /** Built client-side from the flat list returned by the API. */
  children?: IDocument[];
}

export interface CreateDocumentInput {
  title?: string;
  type: DocumentType;
  status?: DocumentStatus;
  content?: string;
  parent_id?: string | null;
}

export interface DocumentUpdate {
  title?: string;
  content?: string;
  status?: DocumentStatus;
  parent_id?: string; // "" moves the document to the top level
}
