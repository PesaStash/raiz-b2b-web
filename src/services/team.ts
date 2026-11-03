import { AuthAxios, CustomAxiosRequestConfig } from "@/lib/authAxios";
import { PublicAxios } from "@/lib/publicAxios";
import {
  invitationDetailsSchema,
  teamSchema,
  unwrapResponse,
} from "@/lib/team";
import type { InvitePayload, InvitableRole, TeamResponse } from "@/types/team";
const base = "/business/account_user/team";
const silent = { silent: true } as CustomAxiosRequestConfig;


export async function fetchTeam(signal?: AbortSignal): Promise<TeamResponse> {
  const response = await AuthAxios.get(`${base}/`, { ...silent, signal });
  const result = teamSchema.safeParse(unwrapResponse(response.data));
  if (!result.success)
    throw new Error(
      "We couldn't read the team response. Please try again or contact support.",
    );
  return result.data;
}

export async function inviteMember(
  payload: InvitePayload,
  idempotencyKey: string,
) {
  return AuthAxios.post(`${base}/invitations`, payload, {
    ...silent,
    headers: { "idempotency-key": idempotencyKey },
  });
}

export async function resendInvitation(id: string, idempotencyKey: string) {
  return AuthAxios.post(
    `${base}/invitations/${encodeURIComponent(id)}/resend`,
    null,
    { ...silent, headers: { "idempotency-key": idempotencyKey } },
  );
}

export async function revokeInvitation(id: string) {
  return AuthAxios.delete(
    `${base}/invitations/${encodeURIComponent(id)}`,
    silent,
  );
}

export async function updateMember(
  id: string,
  payload: { role?: InvitableRole; active?: boolean },
) {
  return AuthAxios.patch(
    `${base}/members/${encodeURIComponent(id)}`,
    payload,
    silent,
  );
}


export async function getInvitation(token: string, signal?: AbortSignal) {
  const response = await PublicAxios.get(
    `/business/auth/invitations/${encodeURIComponent(token)}`,
    { ...silent, signal },
  );
  const result = invitationDetailsSchema.safeParse(
    unwrapResponse(response.data),
  );
  if (!result.success)
    throw new Error(
      "We couldn't read this invitation. Please try again or contact the business owner.",
    );
  return result.data;
}


export async function acceptInvitation(token: string, password: string) {
  return PublicAxios.post(
    "/business/auth/invitations/accept",
    { token, password },
    silent,
  );
}
