import { getApiErrorMessage } from "@/utils/helpers";
import { IPaymentChannel } from "@/types/services";

const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "OL",
  "UL",
  "LI",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "SPAN",
  "DIV",
  "A",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(["href", "target", "rel"]),
};

const PROVIDER_NAME_PATTERN =
  /\b(yellow\s*card|yellowcard|gravv|receive|collection\s*provider)\b/gi;

export const AFRICA_UNSUPPORTED_COUNTRY_CODES = new Set(["NG", "GH"]);

const isSafeHref = (href: string) => {
  const value = href.trim().toLowerCase();
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("/")
  );
};

export const scrubProviderNames = (value?: string | null): string => {
  if (!value) return "";
  return value.replace(PROVIDER_NAME_PATTERN, "payment method");
};

/**
 * Sanitize provider HTML payment instructions for safe rendering.
 * Falls back to escaped plain text with line breaks when DOM APIs are unavailable.
 */
export const sanitizePaymentInstructionHtml = (html: string): string => {
  if (!html) return "";
  const scrubbed = scrubProviderNames(html);

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return scrubbed
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/\n/g, "<br />");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(scrubbed, "text/html");

  const walk = (node: Node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tag = el.tagName.toUpperCase();

        if (!ALLOWED_TAGS.has(tag)) {
          const text = doc.createTextNode(el.textContent || "");
          el.replaceWith(text);
          continue;
        }

        Array.from(el.attributes).forEach((attr) => {
          const allowed = ALLOWED_ATTRS[tag];
          if (!allowed || !allowed.has(attr.name.toLowerCase())) {
            el.removeAttribute(attr.name);
            return;
          }
          if (attr.name.toLowerCase() === "href" && !isSafeHref(attr.value)) {
            el.removeAttribute(attr.name);
          }
        });

        if (tag === "A") {
          el.setAttribute("rel", "noopener noreferrer nofollow");
          if (!el.getAttribute("target")) {
            el.setAttribute("target", "_blank");
          }
        }

        walk(el);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.parentNode?.removeChild(child);
      }
    }
  };

  walk(doc.body);
  return doc.body.innerHTML;
};

export type AfricaPayinUiErrorKind =
  | "recipient_unavailable"
  | "unsupported_country"
  | "ghana_unsupported"
  | "nigeria_palmpay"
  | "payer_not_found"
  | "payer_verification_required"
  | "wallet_unavailable"
  | "kyb_incomplete"
  | "expired"
  | "already_finalized"
  | "validation"
  | "temporary"
  | "not_found"
  | "generic";

export interface AfricaPayinUiError {
  kind: AfricaPayinUiErrorKind;
  message: string;
  status?: number;
  detail?: string;
  correlationId?: string;
}

const extractDetail = (error: unknown): string => {
  if (!error || typeof error !== "object") return "";
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object") return "";
  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: unknown }).msg);
        }
        return "";
      })
      .filter(Boolean)
      .join(" ");
  }
  if (typeof (data as { message?: unknown }).message === "string") {
    return String((data as { message: string }).message);
  }
  if (Array.isArray((data as { errors?: unknown }).errors)) {
    return ((data as { errors: unknown[] }).errors)
      .map((item) => (typeof item === "string" ? item : ""))
      .filter(Boolean)
      .join(" ");
  }
  return "";
};

const extractCorrelationId = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object") return undefined;
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object") return undefined;
  const value = (data as { correlation_id?: unknown }).correlation_id;
  return typeof value === "string" && value ? value : undefined;
};

export const mapAfricaPayinError = (error: unknown): AfricaPayinUiError => {
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : undefined;
  const detail = extractDetail(error);
  const correlationId = extractCorrelationId(error);
  const normalized = detail.toLowerCase();

  if (correlationId && typeof console !== "undefined") {
    console.warn("[africa-payin]", {
      correlation_id: correlationId,
      status,
      detail: detail || undefined,
    });
  }

  if (
    normalized.includes("nigeria collections should use palmpay") ||
    normalized.includes("nigeria collections should use palm pay")
  ) {
    return {
      kind: "nigeria_palmpay",
      message:
        "Nigeria payments use bank transfer. Please continue with the Nigeria payment flow.",
      status,
      detail,
      correlationId,
    };
  }

  if (normalized.includes("ghana is not supported")) {
    return {
      kind: "ghana_unsupported",
      message:
        "This country is not available for this payment method. Please choose another supported country.",
      status,
      detail,
      correlationId,
    };
  }

  if (
    normalized.includes("payer email verification is required") ||
    normalized.includes("email verification is required before payment")
  ) {
    return {
      kind: "payer_verification_required",
      message: "Verify your email to continue.",
      status,
      detail,
      correlationId,
    };
  }

  if (normalized.includes("payer profile not found")) {
    return {
      kind: "payer_not_found",
      message: "Please complete payer registration to continue.",
      status,
      detail,
      correlationId,
    };
  }

  if (
    normalized.includes("wallet not found") ||
    normalized.includes("wallet is not active")
  ) {
    return {
      kind: "wallet_unavailable",
      message:
        "This wallet isn’t available for payments right now. Please try again later.",
      status,
      detail,
      correlationId,
    };
  }

  if (
    status === 404 &&
    (normalized.includes("recipient account not found") ||
      normalized.includes("recipient cannot receive"))
  ) {
    return {
      kind: "recipient_unavailable",
      message:
        "This recipient can’t receive local payments right now. Please contact the recipient.",
      status,
      detail,
      correlationId,
    };
  }

  if (
    normalized.includes("recipient cannot receive funds via this payment channel")
  ) {
    return {
      kind: "recipient_unavailable",
      message:
        "This recipient isn’t available for this payment method. Please choose another option.",
      status,
      detail,
      correlationId,
    };
  }

  if (
    status === 403 ||
    normalized.includes("destination is not configured")
  ) {
    return {
      kind: "recipient_unavailable",
      message:
        "This recipient isn’t set up to receive this payment method yet. Please contact the recipient.",
      status,
      detail,
      correlationId,
    };
  }

  if (
    status === 409 ||
    normalized.includes("kyb") ||
    normalized.includes("business address") ||
    normalized.includes("registration number") ||
    normalized.includes("complete your profile")
  ) {
    return {
      kind: "kyb_incomplete",
      message:
        "Complete your business profile and verification before topping up.",
      status,
      detail,
      correlationId,
    };
  }

  if (
    normalized.includes("country is not supported") ||
    normalized.includes("not supported for africa collections")
  ) {
    return {
      kind: "unsupported_country",
      message:
        "This country is not available for this payment method. Please choose another supported country.",
      status,
      detail,
      correlationId,
    };
  }

  if (normalized.includes("country is required")) {
    return {
      kind: "recipient_unavailable",
      message:
        "This recipient’s profile is incomplete for local payments. Please contact the recipient.",
      status,
      detail,
      correlationId,
    };
  }

  if (
    normalized.includes("expired") ||
    normalized.includes("initiate a new transaction")
  ) {
    return {
      kind: "expired",
      message: "This payment session expired. Please start a new payment.",
      status,
      detail,
      correlationId,
    };
  }

  if (normalized.includes("already been finalized or denied")) {
    return {
      kind: "already_finalized",
      message: "This payment was already confirmed. Refreshing the latest status.",
      status,
      detail,
      correlationId,
    };
  }

  if (status === 400 || status === 422) {
    return {
      kind: "validation",
      message: scrubProviderNames(
        getApiErrorMessage(
          error,
          "Please check the payment details and try again.",
        ),
      ),
      status,
      detail,
      correlationId,
    };
  }

  if (status === 502 || status === 503 || status === 500) {
    return {
      kind: "temporary",
      message: "We could not start this payment. Please try again.",
      status,
      detail,
      correlationId,
    };
  }

  if (status === 404) {
    return {
      kind: "not_found",
      message: "We couldn’t find this payment session.",
      status,
      detail,
      correlationId,
    };
  }

  return {
    kind: "generic",
    message: scrubProviderNames(
      getApiErrorMessage(
        error,
        "Something went wrong while setting up this payment.",
      ),
    ),
    status,
    detail,
    correlationId,
  };
};

export const getChannelLabel = (channelNameOrId?: string | null) => {
  if (!channelNameOrId) return "Bank transfer";
  const normalized = channelNameOrId.toLowerCase();
  if (
    normalized === "momo" ||
    normalized === "mobile_money" ||
    normalized === "mobile-money" ||
    normalized.includes("mobile") ||
    normalized.includes("momo")
  ) {
    return "Mobile money";
  }
  return "Bank transfer";
};

export const isMomoChannel = (
  channel?: Pick<IPaymentChannel, "channel_name" | "channel_id"> | null,
  accountType?: string | null,
  channelName?: string | null,
  channelId?: string | null,
) => {
  const candidates = [
    accountType,
    channel?.channel_name,
    channel?.channel_id,
    channelName,
    channelId,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return candidates.some(
    (value) =>
      value === "momo" ||
      value === "mobile_money" ||
      value === "mobile-money" ||
      value.includes("mobile") ||
      value.includes("momo"),
  );
};

export const resolveAccountType = (
  channel?: Pick<IPaymentChannel, "channel_name" | "channel_id"> | null,
  accountType?: string | null,
  channelName?: string | null,
  channelId?: string | null,
): "bank" | "momo" =>
  isMomoChannel(channel, accountType, channelName, channelId) ? "momo" : "bank";

export const filterAfricaPayinCountries = <
  T extends { country_code: string },
>(
  countries: T[] | undefined | null,
): T[] =>
  (countries || []).filter(
    (country) =>
      !AFRICA_UNSUPPORTED_COUNTRY_CODES.has(
        String(country.country_code || "").toUpperCase(),
      ),
  );

export const getAfricaCountryFlagUrl = (countryCode?: string | null) => {
  if (!countryCode) return "/icons/website.svg";
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
};

/** Initiate accepts USD between 1 and 20000. */
export const AFRICA_USD_AMOUNT_MIN = 1;
export const AFRICA_USD_AMOUNT_MAX = 20000;

export const clampAfricaUsdLimit = (
  value: number,
  bound: "min" | "max" = "min",
): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return bound === "min" ? AFRICA_USD_AMOUNT_MIN : AFRICA_USD_AMOUNT_MAX;
  }
  // Round up to 2dp so we never understate the limit after conversion.
  const rounded = Math.ceil(value * 100) / 100;
  return Math.min(
    AFRICA_USD_AMOUNT_MAX,
    Math.max(AFRICA_USD_AMOUNT_MIN, rounded),
  );
};

export const copyToClipboard = async (value: string) => {
  if (!value || typeof navigator === "undefined") return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};
