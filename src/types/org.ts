export type Role = "owner" | "admin" | "member" | "guest";

/** Roles that can be assigned via invitation (owner is reserved for creators). */
export type InvitableRole = Exclude<Role, "owner">;

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
  status?: string;
  /** Present on single-org reads: the caller's role in this org. */
  role?: Role;
}

export interface Member {
  user_id: string;
  email: string;
  name: string;
  role: Role;
  joined_at: Date;
}

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: Role;
  space_id?: string | null; // target space, or null for an org-only invite
  invited_by?: string | null;
  expires_at: Date;
  accepted_at?: Date | null;
  created_at: Date;
}

export interface InviteResult {
  invitation: Invitation;
  accept_url: string;
}
