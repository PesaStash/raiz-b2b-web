import { getApiErrorMessage } from "@/utils/helpers";

export type SwiftErrorKind =
  | "pin"
  | "insufficient_balance"
  | "inactive_beneficiary"
  | "file"
  | "not_found"
  | "validation"
  | "generic";

export type SwiftUiError = {
  kind: SwiftErrorKind;
  message: string;
  status?: number;
  fieldErrors: Record<string, string>;
};

type DetailObject = {
  message?: string;
  errors?: Array<{ field?: string; message?: string }>;
};

type FastApiValidationItem = {
  loc?: Array<string | number>;
  msg?: string;
  message?: string;
};

function extractDetail(error: unknown): {
  status?: number;
  detail?: DetailObject | string | FastApiValidationItem[];
} {
  const axiosLike = error as {
    status?: number;
    data?:
      | DetailObject
      | { detail?: DetailObject | string | FastApiValidationItem[]; message?: string };
    response?: {
      status?: number;
      data?:
        | DetailObject
        | { detail?: DetailObject | string | FastApiValidationItem[]; message?: string };
    };
  };

  if (axiosLike.response) {
    const data = axiosLike.response.data;
    if (typeof data === "object" && data && "detail" in data) {
      return { status: axiosLike.response.status, detail: data.detail };
    }
    return { status: axiosLike.response.status, detail: data as DetailObject };
  }

  if (axiosLike.status !== undefined || axiosLike.data) {
    const data = axiosLike.data;
    if (typeof data === "object" && data && "detail" in data) {
      return { status: axiosLike.status, detail: data.detail };
    }
    return { status: axiosLike.status, detail: data as DetailObject };
  }

  return {};
}

function normalizeFieldKey(field?: string): string | undefined {
  if (!field) return undefined;
  return field.replace(/^body\./, "").replace(/^data\./, "");
}

function mapFieldErrors(
  detail: DetailObject | string | FastApiValidationItem[] | undefined,
): Record<string, string> {
  if (!detail || typeof detail === "string") return {};

  const mapped: Record<string, string> = {};

  if (Array.isArray(detail)) {
    detail.forEach((item) => {
      const loc = item.loc || [];
      const fieldParts = loc.filter(
        (part): part is string => typeof part === "string" && part !== "body",
      );
      const key = normalizeFieldKey(fieldParts[fieldParts.length - 1]);
      const message = item.msg || item.message;
      if (key && message) mapped[key] = message;
    });
    return mapped;
  }

  detail.errors?.forEach((item) => {
    const key = normalizeFieldKey(item.field);
    if (key && item.message) mapped[key] = item.message;
  });

  return mapped;
}

function detailMessage(
  detail: DetailObject | string | FastApiValidationItem[] | undefined,
): string {
  if (!detail) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg || item.message || "")
      .filter(Boolean)
      .join(" ");
  }
  return detail.message || "";
}

export function mapSwiftError(
  error: unknown,
  fallback = "Unable to complete that request. Please try again.",
): SwiftUiError {
  const { status, detail } = extractDetail(error);
  const fieldErrors = mapFieldErrors(detail);
  const message = detailMessage(detail) || getApiErrorMessage(error, fallback);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("pin") &&
    (normalized.includes("invalid") ||
      normalized.includes("incorrect") ||
      normalized.includes("wrong"))
  ) {
    return { kind: "pin", message, status, fieldErrors };
  }

  if (
    normalized.includes("insufficient") &&
    (normalized.includes("balance") || normalized.includes("fund"))
  ) {
    return { kind: "insufficient_balance", message, status, fieldErrors };
  }

  if (normalized.includes("inactive beneficiary")) {
    return { kind: "inactive_beneficiary", message, status, fieldErrors };
  }

  if (
    normalized.includes("unsupported file") ||
    normalized.includes("file type") ||
    normalized.includes("file too large") ||
    normalized.includes("too large")
  ) {
    return {
      kind: "file",
      message,
      status,
      fieldErrors: {
        ...fieldErrors,
        invoice_file: fieldErrors.invoice_file || message,
      },
    };
  }

  if (status === 404 || normalized.includes("not found")) {
    return { kind: "not_found", message, status, fieldErrors };
  }

  if (status === 400 || status === 422 || Object.keys(fieldErrors).length > 0) {
    return { kind: "validation", message, status, fieldErrors };
  }

  return { kind: "generic", message, status, fieldErrors };
}
