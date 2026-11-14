type ApiError = {
  status?: number;
  data?: Record<string, unknown>;
  response?: { status?: number; data?: Record<string, unknown> };
  message?: string;
};
export function readApiError(error: unknown) {
  const value = (error ?? {}) as ApiError;
  const response = value.response ?? value;
  const data = response.data ?? {};
  const detail =
    typeof data.detail === "object" && data.detail
      ? (data.detail as Record<string, unknown>)
      : {};
  const messageObject =
    typeof data.message === "object" && data.message
      ? (data.message as Record<string, unknown>)
      : {};
  return {
    status: response.status,
    code: String(
      data.code ?? data.error_code ?? messageObject.code ?? detail.code ?? "",
    ).toLowerCase(),
    message:
      typeof data.message === "string"
        ? data.message
        : typeof messageObject.message === "string"
          ? messageObject.message
          : typeof data.detail === "string"
            ? data.detail
            : typeof detail.message === "string"
              ? detail.message
              : value.message,
  };
}
export function invitationErrorState(
  error: unknown,
): "expired" | "used" | "unavailable" | "error" {
  const { status, code } = readApiError(error);
  if (code.includes("used") || code.includes("accepted")) return "used";
  if (status === 410 || code.includes("expired")) return "expired";
  if (
    [400, 404].includes(status ?? 0) ||
    /revoked|invalid|unavailable/.test(code)
  )
    return "unavailable";
  return "error";
}

export type ApiFieldCorrection = {
  field: string;
  message: string;
  associated_person_id?: string;
  source?: "local" | "bridge";
  placeholder?: string;
};

/** Accept both the API message envelope and FastAPI detail.field_errors (including early 422s). */
export function apiFieldCorrections(error: unknown): ApiFieldCorrection[] {
  const value = (error ?? {}) as ApiError;
  const data = (value.response ?? value).data ?? {};
  const message =
    data.message && typeof data.message === "object"
      ? (data.message as Record<string, unknown>)
      : {};
  const detail =
    data.detail &&
    typeof data.detail === "object" &&
    !Array.isArray(data.detail)
      ? (data.detail as Record<string, unknown>)
      : {};
  const sources = [
    data.field_errors,
    message.field_errors,
    detail.field_errors,
    data.errors,
    message.errors,
    detail.errors,
    data.detail,
  ];
  const result: ApiFieldCorrection[] = [];
  const seen = new Set<string>();
  for (const item of sources.flatMap((source) =>
    Array.isArray(source) ? source : [],
  )) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const field =
      typeof row.field === "string"
        ? row.field
        : Array.isArray(row.loc)
          ? row.loc.filter((part) => part !== "body").join(".")
          : undefined;
    const text = row.message ?? row.msg;
    const key = JSON.stringify([field, text, row.associated_person_id]);
    if (
      typeof field === "string" &&
      field &&
      typeof text === "string" &&
      !seen.has(key)
    ) {
      seen.add(key);
      result.push({
        field,
        message: text,
        ...(typeof row.associated_person_id === "string"
          ? { associated_person_id: row.associated_person_id }
          : {}),
        ...(row.source === "local" || row.source === "bridge"
          ? { source: row.source }
          : {}),
        ...(typeof row.placeholder === "string"
          ? { placeholder: row.placeholder }
          : {}),
      });
    }
  }
  return result;
}

export function apiFieldErrors(error: unknown): Record<string, string> {
  return Object.fromEntries(
    apiFieldCorrections(error).map(({ field, message }) => [field, message]),
  );
}
