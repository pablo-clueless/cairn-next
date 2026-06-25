/** A file attached to an issue. */
export interface Attachment {
  id: string;
  organization_id: string;
  issue_id: string;
  uploaded_by: string | null;
  uploader_name: string | null;
  filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
}
