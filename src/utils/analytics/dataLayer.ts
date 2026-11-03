import type {
  DataLayerEventMap,
  DataLayerEventName,
  FailureReason,
  RecipientType,
  TransactionType,
} from "@/types/analytics";
import {
  GetItemFromLocalStorage,
  SetItemToLocalStorage,
} from "@/utils/localStorageFunc";

const FIRST_TXN_FLAG_KEY = "raiz_first_txn_fired";
const USER_DATA_SESSION_KEY = "raiz_user_data_fired";
const DEDUP_PREFIX = "raiz_dl_dedup_";

const MONETARY_EVENTS: ReadonlySet<DataLayerEventName> = new Set([
  "topup_completed",
  "send_completed",
  "swap_completed",
  "bill_payment_completed",
  "invoice_paid",
  "invoice_created",
  "request_completed",
  "first_transaction_completed",
]);

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getDedupKey(id: string): string {
  return `${DEDUP_PREFIX}${id}`;
}

function hasFired(dedupId: string): boolean {
  if (!isBrowser()) return true;
  try {
    return sessionStorage.getItem(getDedupKey(dedupId)) === "1";
  } catch {
    return false;
  }
}

function markFired(dedupId: string): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(getDedupKey(dedupId), "1");
  } catch {
    // ignore quota / private mode errors
  }
}

/**
 * Push a typed event to `window.dataLayer` for GTM.
 * No-ops on the server. Deduplicates when `dedupId` is provided.
 */
export function pushDataLayerEvent<T extends DataLayerEventName>(
  event: T,
  payload: DataLayerEventMap[T],
  options?: { dedupId?: string },
): void {
  if (!isBrowser()) return;

  const dedupId = options?.dedupId;
  if (dedupId && hasFired(dedupId)) return;

  window.dataLayer = window.dataLayer || [];

  if (MONETARY_EVENTS.has(event)) {
    window.dataLayer.push({ ecommerce: null });
  }

  window.dataLayer.push({
    event,
    ...payload,
  });

  if (dedupId) markFired(dedupId);
}

/** Extract a stable transaction id from common API response shapes. */
export function getTransactionId(response: unknown): string | undefined {
  if (!response || typeof response !== "object") return undefined;
  const r = response as Record<string, unknown>;
  const id =
    r.transaction_report_id ??
    r.transaction_reference ??
    r.session_id ??
    r.transaction_id ??
    r.id;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

export function getTransactionStatus(response: unknown): string | undefined {
  if (!response || typeof response !== "object") return undefined;
  const r = response as Record<string, unknown>;
  const statusObj = r.transaction_status;
  if (statusObj && typeof statusObj === "object") {
    const status = (statusObj as Record<string, unknown>).transaction_status;
    return typeof status === "string" ? status : undefined;
  }
  return typeof r.status === "string" ? r.status : undefined;
}

export function mapGenericFailureReason(error: unknown): FailureReason {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msg = String((error as any)?.data?.message ?? (error as any)?.message ?? "").toLowerCase();
  if (msg.includes("insufficient")) return "insufficient_funds";
  if (msg.includes("network") || msg.includes("timeout")) return "network_error";
  if (msg.includes("declin") || msg.includes("reject")) return "declined";
  if (msg.includes("cancel")) return "cancelled";
  return "unknown";
}

export function hasFirstTransactionFired(): boolean {
  return GetItemFromLocalStorage(FIRST_TXN_FLAG_KEY) === true;
}

export function markFirstTransactionFired(): void {
  SetItemToLocalStorage(FIRST_TXN_FLAG_KEY, true);
}

/** Fire a money-movement success event and optionally `first_transaction_completed`. */
export function trackMoneyMovementSuccess(params: {
  event:
    | "topup_completed"
    | "send_completed"
    | "swap_completed"
    | "bill_payment_completed";
  transactionId: string;
  value: number;
  currency: string;
  extra?: Record<string, unknown>;
  daysSinceSignup?: number;
}): void {
  const { event, transactionId, value, currency, extra = {}, daysSinceSignup } =
    params;

  if (!transactionId || !Number.isFinite(value) || !currency) return;

  pushDataLayerEvent(
    event,
    {
      transaction_id: transactionId,
      value,
      currency,
      ...extra,
    } as DataLayerEventMap[typeof event],
    { dedupId: `${event}:${transactionId}` },
  );

  if (!hasFirstTransactionFired()) {
    const txnType: TransactionType =
      event === "topup_completed"
        ? "topup"
        : event === "send_completed"
          ? "send"
          : event === "swap_completed"
            ? "swap"
            : "bill_payment";

    pushDataLayerEvent(
      "first_transaction_completed",
      {
        transaction_type: txnType,
        value,
        currency,
        ...(daysSinceSignup !== undefined ? { days_since_signup: daysSinceSignup } : {}),
      },
      { dedupId: `first_transaction_completed:${transactionId}` },
    );
    markFirstTransactionFired();
  }
}

export function trackSendCompleted(params: {
  response: unknown;
  value: number;
  currency: string;
  recipientType: RecipientType;
  daysSinceSignup?: number;
}): void {
  const status = getTransactionStatus(params.response);
  if (status !== "completed") return;

  const transactionId = getTransactionId(params.response);
  if (!transactionId) return;

  trackMoneyMovementSuccess({
    event: "send_completed",
    transactionId,
    value: params.value,
    currency: params.currency,
    extra: { recipient_type: params.recipientType },
    daysSinceSignup: params.daysSinceSignup,
  });
}

export function trackTransactionFailed(params: {
  transactionType: TransactionType;
  error?: unknown;
  value?: number;
  currency?: string;
  dedupId?: string;
}): void {
  pushDataLayerEvent(
    "transaction_failed",
    {
      transaction_type: params.transactionType,
      failure_reason: mapGenericFailureReason(params.error),
      ...(params.value !== undefined ? { value: params.value } : {}),
      ...(params.currency ? { currency: params.currency } : {}),
    },
    params.dedupId ? { dedupId: params.dedupId } : undefined,
  );
}

export function hasUserDataFiredThisSession(): boolean {
  if (!isBrowser()) return true;
  try {
    return sessionStorage.getItem(USER_DATA_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markUserDataFiredThisSession(): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(USER_DATA_SESSION_KEY, "1");
  } catch {
    // ignore
  }
}

export function clearUserDataSessionFlag(): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(USER_DATA_SESSION_KEY);
  } catch {
    // ignore
  }
}

export function daysSince(isoDate: string | undefined | null): number | undefined {
  if (!isoDate) return undefined;
  const created = new Date(isoDate).getTime();
  if (Number.isNaN(created)) return undefined;
  return Math.max(0, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)));
}
