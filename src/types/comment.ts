/** A comment posted on an issue. `author_id` is null if the author was deleted. */
export interface Comment {
  id: string;
  issue_id: string;
  author_id: string | null;
  author_name: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentInput {
  body: string;
}

export interface CommentUpdate {
  body: string;
}
