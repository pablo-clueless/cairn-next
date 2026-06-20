export interface User {
  id: string;
  email: string;
  name: string;
  is_platform_admin: boolean;
  default_org_slug: string;
  created_at: Date;
  updated_at: Date;
}
