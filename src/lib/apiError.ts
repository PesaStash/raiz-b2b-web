type ApiError = { status?: number; data?: Record<string, unknown>; response?: { status?: number; data?: Record<string, unknown> }; message?: string };
export function readApiError(error: unknown) {
  const value = (error ?? {}) as ApiError;
  const response = value.response ?? value;
  const data = response.data ?? {};
  const detail = typeof data.detail === "object" && data.detail ? data.detail as Record<string, unknown> : {};
  return {
    status: response.status,
    code: String(data.code ?? data.error_code ?? detail.code ?? "").toLowerCase(),
    message: typeof data.message === "string" ? data.message : typeof data.detail === "string" ? data.detail : typeof detail.message === "string" ? detail.message : value.message,
  };
}
export function invitationErrorState(error: unknown): "expired" | "used" | "unavailable" | "error" {
  const { status, code } = readApiError(error);
  if (code.includes("used") || code.includes("accepted")) return "used";
  if (status === 410 || code.includes("expired")) return "expired";
  if ([400, 404].includes(status ?? 0) || /revoked|invalid|unavailable/.test(code)) return "unavailable";
  return "error";
}
