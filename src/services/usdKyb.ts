import { validationForPeople } from "@/lib/usd-kyb/corrections";
import { personPatch } from "@/lib/usd-kyb/model";
import { AuthAxios, type CustomAxiosRequestConfig } from "@/lib/authAxios";
import { PublicAxios } from "@/lib/publicAxios";
import type {
  KybBundle,
  KybMutation,
  KybPatch,
  LookupResult,
  KybDocument,
  UploadTarget,
  PersonInvitation,
  IdentitySession,
  KybFormGuide,
} from "@/types/usdKyb";
const base = "/business/entities/verifications/usd-kyb";
const publicBase = "/business/auth/kyb-person-invitations";
const silent = { silent: true } as CustomAxiosRequestConfig;
function data<T>(body: { success: boolean; data: T | null }): T {
  if (!body?.success || body.data == null)
    throw new Error("The KYB service returned an incomplete response.");
  const payload = body.data as T & Partial<KybBundle>;
  return Array.isArray(payload.associated_persons) && payload.validation
    ? {
        ...payload,
        validation: validationForPeople(
          payload.validation,
          payload.associated_persons,
        ),
      }
    : body.data;
}
export const kybApi = {
  get: async () => data<KybBundle>((await AuthAxios.get(base, silent)).data),
  patch: async (payload: KybPatch) =>
    data<KybMutation>(
      (
        await AuthAxios.patch(
          base,
          {
            ...payload,
            ...(payload.associated_persons
              ? {
                  associated_persons:
                    payload.associated_persons.map(personPatch),
                }
              : {}),
          },
          silent,
        )
      ).data,
    ),
  lookup: async (
    registration_number: string,
    registration_type: string,
    consent: boolean,
  ) =>
    data<LookupResult>(
      (
        await AuthAxios.post(
          `${base}/company-lookup`,
          { registration_number, registration_type, consent },
          silent,
        )
      ).data,
    ),
  validate: async () =>
    data<KybMutation>(
      (await AuthAxios.post(`${base}/validate`, undefined, silent)).data,
    ),
  submit: async (
    expected_version: number,
    onSubmitted?: (message: string) => void,
  ) => {
    const response = await AuthAxios.post(
      `${base}/submit-for-review`,
      { expected_version, declaration_accepted: true },
      silent,
    );
    const bundle = data<KybBundle>(response.data);
    onSubmitted?.(
      typeof response.data.message === "string" && response.data.message.trim()
        ? response.data.message
        : "Your business verification has been submitted for review.",
    );
    return bundle;
  },
  guide: async () =>
    data<KybFormGuide>(
      (await AuthAxios.get(`${base}/form-guide`, silent)).data,
    ),
  formation: async (business_type: string) =>
    data<unknown>(
      (
        await AuthAxios.get(`${base}/formation-documents`, {
          ...silent,
          params: { business_type },
        })
      ).data,
    ),
  industries: async (query: string) =>
    data<unknown>(
      (
        await AuthAxios.get(`${base}/industry-codes`, {
          ...silent,
          params: { query, limit: 50 },
        })
      ).data,
    ),
  purposes: async () =>
    data<unknown>(
      (await AuthAxios.get(`${base}/document-purposes`, silent)).data,
    ),
  removePerson: async (id: string, expected_version: number) =>
    data<KybMutation>(
      (
        await AuthAxios.delete(
          `${base}/associated-persons/${encodeURIComponent(id)}`,
          { ...silent, params: { expected_version } },
        )
      ).data,
    ),
  invitation: async (id: string, action: "send" | "resend" | "revoke") => {
    const url = `${base}/associated-persons/${encodeURIComponent(id)}/invitations`;
    return data<PersonInvitation>(
      (
        await (action === "revoke"
          ? AuthAxios.delete(url, silent)
          : AuthAxios.post(
              action === "resend" ? `${url}/resend` : url,
              undefined,
              silent,
            ))
      ).data,
    );
  },
  upload: async (
    file: File,
    purpose: string,
    personId: string | null,
    onProgress: (value: number) => void,
    description?: string,
  ) => {
    const target = (
      await AuthAxios.post(
        `${base}/documents/upload-url`,
        {
          content_type: file.type,
          file_size: file.size,
          document_type: purpose,
        },
        silent,
      )
    ).data as UploadTarget;
    if (
      !target.file_url?.startsWith("s3://") ||
      !target.upload_url ||
      target.method !== "PUT"
    )
      throw new Error("The service did not return a private upload target.");
    if (file.size > target.max_file_size)
      throw new Error("This file exceeds the upload limit.");
    onProgress(0);
    const uploaded = await fetch(target.upload_url, {
      method: target.method,
      headers: target.required_headers,
      body: file,
      credentials: "omit",
    });
    if (!uploaded.ok)
      throw new Error(
        `Document upload failed (HTTP ${uploaded.status}). Please try again.`,
      );
    onProgress(100);
    return data<KybDocument>(
      (
        await AuthAxios.post(
          `${base}/documents`,
          {
            file_url: target.file_url,
            purposes: [purpose],
            associated_person_id: personId,
            section: "documents",
            file_name: file.name,
            content_type: file.type,
            file_size: file.size,
            description: description ?? file.name,
            payload: {},
          },
          silent,
        )
      ).data,
    );
  },
  removeDocument: async (id: string) => {
    await AuthAxios.delete(
      `${base}/documents/${encodeURIComponent(id)}`,
      silent,
    );
  },
};
export const personInvitationApi = {
  inspect: async (token: string, signal?: AbortSignal) =>
    data<PersonInvitation>(
      (
        await PublicAxios.post(
          `${publicBase}/inspect`,
          { token },
          { ...silent, signal },
        )
      ).data,
    ),
  session: async (token: string) =>
    data<IdentitySession>(
      (await PublicAxios.post(`${publicBase}/session`, { token }, silent)).data,
    ),
  status: async (token: string, signal?: AbortSignal) =>
    data<PersonInvitation>(
      (
        await PublicAxios.post(
          `${publicBase}/status`,
          { token },
          { ...silent, signal },
        )
      ).data,
    ),
};
