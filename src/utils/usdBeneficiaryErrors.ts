import { getApiErrorMessage } from "@/utils/helpers";

export type UsdBeneficiaryErrorKind =
  | "routing_rail_mismatch"
  | "missing_wallet"
  | "already_exists"
  | "validation"
  | "temporary"
  | "generic";

export type UsdBeneficiaryUiError = {
  kind: UsdBeneficiaryErrorKind;
  message: string;
  status?: number;
  fieldErrors?: Record<string, string>;
  /** Wire-specific secondary hint for routing/rail mismatch. */
  hint?: string;
};

const ROUTING_RAIL_MISMATCH_FRAGMENT =
  "routing number is not valid for the selected payment rail";

const ROUTING_RAIL_UI_MESSAGE =
  "This routing number does not support the selected payment rail. Choose another rail or enter the correct routing number for this rail.";

const WIRE_ROUTING_HINT =
  "Some banks use different routing numbers for ACH and Wire transfers.";

type DetailObject = {
  message?: string;
  errors?: Array<{ field?: string; message?: string; loc?: unknown }>;
};

type FastApiValidationItem = {
  loc?: Array<string | number>;
  msg?: string;
  message?: string;
  type?: string;
};

function extractDetailObject(error: unknown): {
  status?: number;
  detail?: DetailObject | string | FastApiValidationItem[];
} {
  const axiosLike = error as {
    status?: number;
    data?: DetailObject | { detail?: DetailObject | string | FastApiValidationItem[]; message?: string };
    response?: {
      status?: number;
      data?: DetailObject | { detail?: DetailObject | string | FastApiValidationItem[]; message?: string };
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
  return field.replace(/^body\./, "").replace(/^data\./, "").replace(/\./g, "_");
}

function detailToMessage(
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

export function isRoutingRailMismatchError(error: unknown): boolean {
  const { detail } = extractDetailObject(error);
  const detailText = detailToMessage(detail);
  return detailText.toLowerCase().includes(ROUTING_RAIL_MISMATCH_FRAGMENT);
}

function mapFastApiFieldErrors(
  detail: DetailObject | string | FastApiValidationItem[] | undefined,
): Record<string, string> {
  if (!detail) return {};

  const mapped: Record<string, string> = {};

  if (Array.isArray(detail)) {
    detail.forEach((item) => {
      const loc = item.loc || [];
      const fieldParts = loc.filter(
        (part): part is string => typeof part === "string" && part !== "body",
      );
      const key = normalizeFieldKey(fieldParts.join("."));
      const message = item.msg || item.message;
      if (key && message) {
        mapped[key] = message;
      }
    });
    return mapped;
  }

  if (typeof detail === "object" && detail.errors) {
    detail.errors.forEach((item) => {
      const key = normalizeFieldKey(item.field);
      if (key && item.message) {
        mapped[key] = item.message;
      }
    });
  }

  return mapped;
}

function extractSelectedRailFromMessage(message: string): string | null {
  const match = message
    .toLowerCase()
    .match(/supports?\s+(wire|ach_same_day|ach same day|ach)\b/);
  if (!match) return null;
  const rail = match[1].replace(/\s+/g, "_");
  return rail;
}

export function mapUsdBeneficiaryError(
  error: unknown,
  fallback = "Unable to add beneficiary. Please try again.",
): UsdBeneficiaryUiError {
  const { status, detail } = extractDetailObject(error);
  const detailMessage = detailToMessage(detail);
  const message = detailMessage || getApiErrorMessage(error, fallback);
  const normalized = message.toLowerCase();

  if (isRoutingRailMismatchError(error) || normalized.includes(ROUTING_RAIL_MISMATCH_FRAGMENT)) {
    const selectedRail = extractSelectedRailFromMessage(message);
    const fieldMessage = ROUTING_RAIL_UI_MESSAGE;
    return {
      kind: "routing_rail_mismatch",
      message: fieldMessage,
      status,
      fieldErrors: {
        routing_number: fieldMessage,
        payment_rail: fieldMessage,
      },
      hint: selectedRail === "wire" ? WIRE_ROUTING_HINT : undefined,
    };
  }

  const fieldErrors = mapFastApiFieldErrors(detail);
  if (Object.keys(fieldErrors).length > 0) {
    return { kind: "validation", message, status, fieldErrors };
  }

  if (
    normalized.includes("usd wallet not found") ||
    normalized.includes("open a usd wallet")
  ) {
    return { kind: "missing_wallet", message, status };
  }

  if (
    normalized.includes("beneficiary already exists") ||
    normalized.includes("proceed to payment")
  ) {
    return { kind: "already_exists", message, status };
  }

  if (
    status === 500 ||
    status === 502 ||
    status === 503 ||
    normalized.includes("possible service downtime") ||
    normalized.includes("try again later or contact support")
  ) {
    return {
      kind: "temporary",
      message:
        message ||
        "Error creating beneficiary. Possible service downtime. Please try again later or contact support.",
      status,
    };
  }

  if (status === 400 || status === 422) {
    return { kind: "validation", message, status, fieldErrors };
  }

  return { kind: "generic", message, status };
}
