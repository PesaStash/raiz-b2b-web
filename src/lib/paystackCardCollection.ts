import type {
  PaystackCardCollectionStatusResponse,
  PaystackCollectionError,
  PaystackCollectionErrorKind,
  PaystackPaymentViewState,
} from "@/types/paystackCardCollection";

/**
 * Preferred RaizServer callback target. Dashboard routes (including "/") also
 * recognise Paystack's `reference`/`trxref` redirect parameters.
 */
export const PAYSTACK_CALLBACK_PATH = "/fund-wallet/paystack/callback";

/** Generic app link agreed with mobile; the app resumes from its own stored checkout. */
export const RAIZ_APP_RETURN_URL = "raizapp://";

export function isMobileUserAgent(
  userAgent: string,
  maxTouchPoints = 0,
): boolean {
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)) return true;
  // iPadOS reports a desktop Safari user agent.
  return /Macintosh/i.test(userAgent) && maxTouchPoints > 1;
}

export const PAYSTACK_POLL_INTERVAL_MS = 3_000;
export const PAYSTACK_POLL_WINDOW_MS = 60_000;
export const PAYSTACK_POLL_MAX_BACKOFF_MS = 15_000;
export const PAYSTACK_DESCRIPTION_MAX_LENGTH = 255;

const PAYSTACK_REFERENCE_PATTERN = /^ps_ngn_[a-z0-9]{8,64}$/i;
const PAYSTACK_CALLBACK_PARAMS = ["reference", "trxref"];

/**
 * Reads the Raiz reference Paystack appends on redirect. It is only a
 * navigation hint; status still comes from the entity-scoped backend lookup.
 */
export function extractPaystackCallbackReference(
  search: string,
): string | null {
  const params = new URLSearchParams(search);
  for (const name of PAYSTACK_CALLBACK_PARAMS) {
    const value = params.get(name)?.trim();
    if (value && PAYSTACK_REFERENCE_PATTERN.test(value)) return value;
  }
  return null;
}

/** Returns `search` without Paystack's redirect parameters (keeps a leading "?"). */
export function stripPaystackCallbackParams(search: string): string {
  const params = new URLSearchParams(search);
  for (const name of PAYSTACK_CALLBACK_PARAMS) params.delete(name);
  const rest = params.toString();
  return rest ? `?${rest}` : "";
}

const AMOUNT_PATTERN = /^(\d+)(?:\.(\d{0,2}))?$/;

/**
 * Converts user input into the backend's decimal-string format ("50000.00").
 * Returns null for empty, non-positive, or over-precise values.
 */
export function normalizePaystackAmount(input: string): string | null {
  const cleaned = input.trim().replace(/,/g, "");
  const match = AMOUNT_PATTERN.exec(cleaned);
  if (!match) return null;
  const whole = match[1].replace(/^0+(?=\d)/, "");
  const fraction = (match[2] ?? "").padEnd(2, "0");
  if (/^0+$/.test(whole) && /^0+$/.test(fraction)) return null;
  return `${whole}.${fraction}`;
}

/** Groups the whole part of a raw typed amount: "1234567.5" -> "1,234,567.5". */
export function formatAmountInput(raw: string): string {
  const [whole, fraction] = raw.split(".");
  const grouped = whole.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

/** Caret index in `formatted` that sits after `count` non-comma characters. */
export function caretAfterSignificantChars(formatted: string, count: number): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] !== ",") seen++;
    if (seen === count) return i + 1;
  }
  return formatted.length;
}

/** Formats a backend decimal string for display without float conversion. */
export function formatDecimalMoney(
  amount: string | null | undefined,
  symbol = "₦",
): string {
  const value = (amount ?? "").trim();
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match) return `${symbol}${value}`;
  const [, sign, whole, fraction = ""] = match;
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const decimals = fraction.length >= 2 ? fraction : fraction.padEnd(2, "0");
  return `${sign}${symbol}${grouped}.${decimals}`;
}

/** Only `completed` + `credited` is success; anything unrecognized stays neutral. */
export function paymentViewState(
  payment: Pick<
    PaystackCardCollectionStatusResponse,
    "status" | "settlement_status"
  >,
): PaystackPaymentViewState {
  if (
    payment.status === "completed" &&
    payment.settlement_status === "credited"
  ) {
    return "success";
  }
  if (payment.status === "failed") return "failed";
  if (payment.status === "review") return "review";
  if (payment.status === "disputed") return "disputed";
  return "processing";
}

/** Statuses that end automatic polling. `completed` without `credited` keeps polling. */
export function isTerminalViewState(state: PaystackPaymentViewState): boolean {
  return state !== "processing";
}

export function isUnexpectedStatusCombination(
  payment: Pick<
    PaystackCardCollectionStatusResponse,
    "status" | "settlement_status"
  >,
): boolean {
  const known = ["pending", "completed", "failed", "review", "disputed"];
  if (!known.includes(payment.status)) return true;
  return (
    payment.status === "completed" && payment.settlement_status !== "credited"
  );
}

/** Network failures and 5xx are temporary; everything else stops polling. */
export function isRetryableStatusError(status: number | undefined): boolean {
  return status === undefined || status >= 500;
}

export function nextPollDelay(consecutiveErrors: number): number {
  if (consecutiveErrors <= 0) return PAYSTACK_POLL_INTERVAL_MS;
  return Math.min(
    PAYSTACK_POLL_INTERVAL_MS * 2 ** consecutiveErrors,
    PAYSTACK_POLL_MAX_BACKOFF_MS,
  );
}

/**
 * One idempotency key per checkout attempt: the same payload reuses its key
 * across retries, a changed payload or an explicit reset starts a new attempt.
 */
export function createIdempotencyKeyTracker(
  generate: () => string = () => crypto.randomUUID(),
) {
  let key: string | null = null;
  let fingerprint: string | null = null;
  return {
    keyFor(payload: unknown): string {
      const next = JSON.stringify(payload);
      if (!key || fingerprint !== next) {
        key = generate();
        fingerprint = next;
      }
      return key;
    },
    reset() {
      key = null;
      fingerprint = null;
    },
  };
}

type ErrorLike = {
  status?: number;
  data?: { detail?: unknown; message?: unknown };
  response?: {
    status?: number;
    data?: { detail?: unknown; message?: unknown };
  };
};

type FastApiValidationItem = { loc?: Array<string | number>; msg?: string };

function readError(error: unknown) {
  const value = (error ?? {}) as ErrorLike;
  const response = value.response ?? value;
  const data = response.data ?? {};
  const detail = data.detail ?? data.message;
  return {
    status: typeof response.status === "number" ? response.status : undefined,
    detail,
    text: typeof detail === "string" ? detail : "",
  };
}

const SUPPORT_SUFFIX = "Please contact support for assistance.";

function build(
  kind: PaystackCollectionErrorKind,
  status: number | undefined,
  message: string,
  extra: Partial<PaystackCollectionError> = {},
): PaystackCollectionError {
  return { kind, status, message, canRetry: false, ...extra };
}

/** Maps the contract's documented HTTP errors to intentional UI states. */
export function mapPaystackCollectionError(
  error: unknown,
): PaystackCollectionError {
  const { status, detail, text } = readError(error);
  const lower = text.toLowerCase();

  if (status === undefined) {
    return build(
      "network",
      status,
      "We couldn't reach Raiz. Check your connection and try again.",
      {
        canRetry: true,
      },
    );
  }

  if (status === 400) {
    if (lower.includes("exceeds the limit"))
      return build("amount_limit", status, text);
    if (lower.includes("ngn wallet")) {
      return build(
        "wallet_reselect",
        status,
        "Please select an NGN wallet to fund.",
      );
    }
  }

  if (status === 401) {
    return build(
      "auth",
      status,
      "Your session has ended. Please sign in again.",
    );
  }

  if (status === 403) {
    if (lower.includes("kyc") || lower.includes("kyb")) {
      return build(
        "verification_required",
        status,
        "Complete your business verification to fund your wallet with a card.",
      );
    }
    if (lower.includes("wallet does not belong")) {
      return build(
        "wallet_reselect",
        status,
        "This wallet isn't available on your account. Please choose another.",
      );
    }
    if (lower.includes("wallet is restricted")) {
      return build(
        "wallet_restricted",
        status,
        `This wallet is restricted. ${SUPPORT_SUFFIX}`,
      );
    }
    return build(
      "account_restricted",
      status,
      `${text || "Your account can't make card payments right now."} ${SUPPORT_SUFFIX}`,
    );
  }

  if (status === 404) {
    if (lower.includes("card collection not found")) {
      return build(
        "collection_not_found",
        status,
        "We couldn't find this card payment on your account.",
      );
    }
    return build(
      "wallet_reselect",
      status,
      "That wallet could not be found. Please choose another.",
    );
  }

  if (status === 409) {
    if (lower.includes("not ready")) {
      return build(
        "wallet_not_ready",
        status,
        "Your NGN wallet isn't ready for transactions yet.",
      );
    }
    return build(
      "duplicate",
      status,
      "A matching payment is already being processed. Please wait before trying again.",
    );
  }

  if (status === 422) {
    const fieldErrors: PaystackCollectionError["fieldErrors"] = {};
    if (Array.isArray(detail)) {
      for (const item of detail as FastApiValidationItem[]) {
        const field = item.loc?.[item.loc.length - 1];
        if (
          field === "amount" ||
          field === "wallet_id" ||
          field === "description"
        ) {
          fieldErrors[field] ??= item.msg || "Invalid value";
        }
      }
    }
    return build(
      "validation",
      status,
      "Please check the highlighted details and try again.",
      {
        fieldErrors,
      },
    );
  }

  if (status === 429) {
    return build(
      "rate_limited",
      status,
      lower.includes("rolling limit")
        ? "You've reached your card funding limit for now. Please try again later."
        : "Too many card payment attempts. Please try again later.",
    );
  }

  if (status === 503) {
    return build(
      "not_configured",
      status,
      "Card funding is temporarily unavailable. Please use bank transfer for now.",
    );
  }

  if (status >= 500) {
    return build(
      "provider_unavailable",
      status,
      "Our card payment provider is temporarily unavailable. Please try again.",
      { canRetry: true },
    );
  }

  return build(
    "unknown",
    status,
    "Something went wrong. Please try again or contact support.",
  );
}

/** Sanitized error code safe for analytics and logs (no provider payloads). */
export function sanitizedErrorCode(error: PaystackCollectionError): string {
  return `${error.status ?? "network"}:${error.kind}`;
}
