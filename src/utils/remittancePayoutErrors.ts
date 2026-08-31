import { getApiErrorMessage } from "@/utils/helpers";

export type RemittanceErrorKind =
  | "unsupported_country"
  | "unsupported_network"
  | "validation"
  | "missing_wallet"
  | "beneficiary_not_found"
  | "minimum_amount"
  | "quote_expired"
  | "already_finalized"
  | "incorrect_pin"
  | "debits_frozen"
  | "temporary"
  | "generic";

export type RemittanceUiError = {
  kind: RemittanceErrorKind;
  message: string;
  status?: number;
  fieldErrors?: Record<string, string>;
};

type DetailObject = {
  message?: string;
  country?: string;
  destination_type?: string;
  network?: string;
  supported_countries?: string[];
  supported_networks?: string[];
  errors?: Array<{ field?: string; message?: string }>;
};

function extractDetailObject(error: unknown): {
  status?: number;
  detail?: DetailObject | string;
} {
  const axiosLike = error as {
    status?: number;
    data?: DetailObject | { detail?: DetailObject | string; message?: string };
    response?: {
      status?: number;
      data?: DetailObject | { detail?: DetailObject | string; message?: string };
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
  return field.replace(/^data\./, "").replace(/\./g, "_");
}

export function mapRemittanceFieldErrors(
  error: unknown,
): Record<string, string> {
  const { detail } = extractDetailObject(error);
  if (!detail || typeof detail === "string") return {};

  const mapped: Record<string, string> = {};
  detail.errors?.forEach((item) => {
    const key = normalizeFieldKey(item.field);
    if (key && item.message) {
      mapped[key] = item.message;
    }
  });
  return mapped;
}

export function mapRemittanceError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): RemittanceUiError {
  const { status, detail } = extractDetailObject(error);
  const detailObj = typeof detail === "string" ? { message: detail } : detail;
  const message = detailObj?.message || getApiErrorMessage(error, fallback);
  const normalized = message.toLowerCase();

  const fieldErrors = mapRemittanceFieldErrors(error);
  if (Object.keys(fieldErrors).length > 0) {
    return { kind: "validation", message, status, fieldErrors };
  }

  if (
    detailObj?.supported_networks?.length ||
    normalized.includes("not supported for")
  ) {
    return {
      kind: "unsupported_network",
      message,
      status,
    };
  }

  if (
    detailObj?.supported_countries?.length ||
    normalized.includes("african countries")
  ) {
    return {
      kind: "unsupported_country",
      message,
      status,
    };
  }

  if (
    normalized.includes("usd wallet not found") ||
    normalized.includes("open a usd wallet")
  ) {
    return { kind: "missing_wallet", message, status };
  }

  if (normalized.includes("please select a usd wallet")) {
    return { kind: "missing_wallet", message, status };
  }

  if (normalized.includes("beneficiary not found")) {
    return { kind: "beneficiary_not_found", message, status };
  }

  if (normalized.includes("less than minimum")) {
    return { kind: "minimum_amount", message, status };
  }

  if (
    normalized.includes("payout has expired") ||
    normalized.includes("create a new payout")
  ) {
    return { kind: "quote_expired", message, status };
  }

  if (normalized.includes("already been finalized")) {
    return { kind: "already_finalized", message, status };
  }

  if (normalized.includes("incorrect transaction pin")) {
    return { kind: "incorrect_pin", message, status };
  }

  if (normalized.includes("debits are frozen")) {
    return { kind: "debits_frozen", message, status };
  }

  if (
    status === 502 ||
    status === 503 ||
    normalized.includes("temporarily unavailable")
  ) {
    return {
      kind: "temporary",
      message:
        message ||
        "International remittance is temporarily unavailable. Please try again later.",
      status,
    };
  }

  if (status === 400 || status === 422) {
    return { kind: "validation", message, status, fieldErrors };
  }

  return { kind: "generic", message, status };
}

export function isBeneficiaryReady(
  status: string | null | undefined,
): boolean {
  return (status || "").toLowerCase() === "success";
}
