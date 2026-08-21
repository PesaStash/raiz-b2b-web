import { getApiErrorMessage } from "@/utils/helpers";

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

/**
 * Sanitize provider HTML payment instructions for safe rendering.
 * Falls back to escaped plain text with line breaks when DOM APIs are unavailable.
 */
export const sanitizePaymentInstructionHtml = (html: string): string => {
  if (!html) return "";

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/\n/g, "<br />");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

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
  return "";
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
  const normalized = detail.toLowerCase();

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
    };
  }

  if (
    status === 403 ||
    status === 409 ||
    normalized.includes("verification") ||
    normalized.includes("destination is not configured")
  ) {
    return {
      kind: "recipient_unavailable",
      message:
        "This recipient isn’t set up to receive this payment method yet. Please contact the recipient.",
      status,
      detail,
    };
  }

  if (normalized.includes("country is not supported")) {
    return {
      kind: "unsupported_country",
      message:
        "Local payments aren’t available for this recipient’s country yet.",
      status,
      detail,
    };
  }

  if (normalized.includes("country is required")) {
    return {
      kind: "recipient_unavailable",
      message:
        "This recipient’s profile is incomplete for local payments. Please contact the recipient.",
      status,
      detail,
    };
  }

  if (normalized.includes("expired")) {
    return {
      kind: "expired",
      message: "This payment session expired. Please start a new payment.",
      status,
      detail,
    };
  }

  if (normalized.includes("already been finalized or denied")) {
    return {
      kind: "already_finalized",
      message: "This payment was already confirmed. Refreshing the latest status.",
      status,
      detail,
    };
  }

  if (status === 400 || status === 422) {
    return {
      kind: "validation",
      message: getApiErrorMessage(
        error,
        "Please check the payment details and try again.",
      ),
      status,
      detail,
    };
  }

  if (status === 502 || status === 503) {
    return {
      kind: "temporary",
      message:
        "Local payments are temporarily unavailable. Please try again later.",
      status,
      detail,
    };
  }

  if (status === 404) {
    return {
      kind: "not_found",
      message: "We couldn’t find this payment session.",
      status,
      detail,
    };
  }

  return {
    kind: "generic",
    message: getApiErrorMessage(
      error,
      "Something went wrong while setting up this payment.",
    ),
    status,
    detail,
  };
};

export const getChannelLabel = (channelNameOrId?: string | null) => {
  if (!channelNameOrId) return "Bank transfer";
  const normalized = channelNameOrId.toLowerCase();
  if (
    normalized === "momo" ||
    normalized === "mobile_money" ||
    normalized === "mobile-money" ||
    normalized.includes("mobile")
  ) {
    return "Mobile money";
  }
  return "Bank transfer";
};

export const getAfricaCountryFlagUrl = (countryCode?: string | null) => {
  if (!countryCode) return "/icons/website.svg";
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
};
