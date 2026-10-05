import { z } from "zod";
import type { TeamInvitation, TeamMember } from "@/types/team";

const role = z.enum(["admin", "developer"]);
const date = z
  .string()
  .refine((value) => Number.isFinite(Date.parse(value)), "Invalid date");
const active = z
  .union([z.boolean(), z.number()])
  .transform((value) => value === true || value === 1);
const identity = {
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
};
const memberSchema = z
  .object({
    ...identity,
    id: z.string().optional(),
    member_id: z.string().optional(),
    business_account_user_id: z.string().optional(),
    business_account_id: z.string().optional(),
    authentication_id: z.string().optional(),
    is_primary: z.boolean().optional(),
    is_verified: z.boolean().optional(),
    has_transaction_pin: z.boolean().optional(),
    role: z.enum(["owner", "admin", "developer"]),
    active,
    selfie_image: z.string().nullish(),
    effective_permissions: z.array(z.string()).optional(),
    created_at: date.optional(),
  })
  .transform((value, ctx): TeamMember => {
    const id = value.business_account_user_id ?? value.member_id ?? value.id;
    if (!id) {
      ctx.addIssue({ code: "custom", message: "Missing member ID" });
      return z.NEVER;
    }
    return { ...value, id, business_account_user_id: id };
  });
const invitationSchema = z
  .object({
    ...identity,
    id: z.string().optional(),
    invitation_id: z.string().optional(),
    business_account_invitation_id: z.string().optional(),
    role,
    sent_at: date.optional(),
    created_at: date.optional(),
    expires_at: date,
    accepted_at: date.nullish(),
    revoked_at: date.nullish(),
    active: active.optional(),
  })
  .transform((value, ctx): TeamInvitation => {
    const id =
      value.business_account_invitation_id ?? value.invitation_id ?? value.id;
    if (!id) {
      ctx.addIssue({ code: "custom", message: "Missing invitation ID" });
      return z.NEVER;
    }
    const sent_at = value.sent_at ?? value.created_at;
    return {
      ...value,
      id,
      business_account_invitation_id: id,
      sent_at,
      created_at: value.created_at ?? sent_at,
    };
  });
export const teamSchema = z.object({
  members: z.array(memberSchema),
  pending_invitations: z.array(invitationSchema),
});
export const invitationDetailsSchema = z
  .object({
    ...identity,
    role,
    expires_at: date,
    business_name: z.string().optional(),
    business: z
      .object({
        business_name: z.string().optional(),
        name: z.string().optional(),
      })
      .optional(),
    business_account: z.object({ business_name: z.string() }).optional(),
  })
  .transform((value, ctx) => {
    const business_name =
      value.business_name ??
      value.business?.business_name ??
      value.business?.name ??
      value.business_account?.business_name;
    if (!business_name) {
      ctx.addIssue({ code: "custom", message: "Missing business name" });
      return z.NEVER;
    }
    return { ...value, business_name };
  });
export function unwrapResponse(value: unknown): unknown {
  if (value && typeof value === "object" && "data" in value) return value.data;
  return value;
}
export const inviteSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Enter a valid work email address"),
  role,
});
export const roleDescriptions = {
  admin:
    "Can manage business settings and perform transactions. Cannot manage team members.",
  developer:
    "Can view business and transaction data and manage Gateway tools, API keys, webhooks, and logs. Cannot move money or change general business settings.",
};
export function isInvitationExpired(
  invitation: Pick<TeamInvitation, "expires_at">,
  now = Date.now(),
) {
  return Date.parse(invitation.expires_at) <= now;
}
export function personName(person: { first_name: string; last_name: string }) {
  return `${person.first_name} ${person.last_name}`.trim();
}
