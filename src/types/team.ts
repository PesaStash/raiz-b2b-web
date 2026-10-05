import type { AccountRole } from "@/lib/permissions";
export type InvitableRole = Exclude<AccountRole, "owner">;
export interface TeamMember {
  id: string;
  business_account_user_id: string;
  business_account_id?: string;
  authentication_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  role: AccountRole;
  is_primary?: boolean;
  is_verified?: boolean;
  has_transaction_pin?: boolean;
  active: boolean;
  selfie_image?: string | null;
  effective_permissions?: string[];
  created_at?: string;
}
export interface TeamInvitation {
  id: string;
  business_account_invitation_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: InvitableRole;
  expires_at: string;
  accepted_at?: string | null;
  revoked_at?: string | null;
  active?: boolean;
  created_at?: string;
  sent_at?: string;
}
export interface TeamResponse {
  members: TeamMember[];
  pending_invitations: TeamInvitation[];
}
export interface InvitePayload {
  first_name: string;
  last_name: string;
  email: string;
  role: InvitableRole;
}
export interface InvitationDetails extends InvitePayload {
  business_name: string;
  expires_at: string;
}
