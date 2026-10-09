import type {
  PaystackCardCollectionInitializeResponse,
  PaystackCardCollectionStatusResponse,
  PendingPaystackCheckout,
} from "@/types/paystackCardCollection";

const KEY_PREFIX = "raiz:paystack-ngn-checkout:";

type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): KeyValueStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const getPaystackCheckoutKey = (entityId: string) => `${KEY_PREFIX}${entityId}`;

/** Copies only the contract's recovery fields; the checkout URL is never persisted. */
export function buildPendingPaystackCheckout(
  response: PaystackCardCollectionInitializeResponse,
  walletId: string,
  now: Date = new Date(),
): PendingPaystackCheckout {
  return {
    actor: "business",
    collection_id: response.collection_id,
    reference: response.reference,
    wallet_id: walletId,
    principal_amount: response.principal_amount,
    fee_amount: response.fee_amount,
    total_amount: response.total_amount,
    started_at: now.toISOString(),
  };
}

/**
 * Display-only record for a callback that arrives without local recovery state
 * (another browser or origin). It is not persisted because the wallet is unknown.
 */
export function pendingCheckoutFromStatus(
  status: PaystackCardCollectionStatusResponse,
  now: Date = new Date(),
): PendingPaystackCheckout {
  return {
    actor: "business",
    collection_id: status.collection_id,
    reference: status.reference,
    wallet_id: "",
    principal_amount: status.principal_amount,
    fee_amount: status.fee_amount,
    total_amount: status.total_amount,
    started_at: now.toISOString(),
  };
}

function isPendingPaystackCheckout(value: unknown): value is PendingPaystackCheckout {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    (record.actor === "business" || record.actor === "personal") &&
    ["collection_id", "reference", "wallet_id", "principal_amount", "fee_amount", "total_amount", "started_at"].every(
      (field) => typeof record[field] === "string" && (record[field] as string).length > 0,
    )
  );
}

export function savePendingPaystackCheckout(
  entityId: string,
  record: PendingPaystackCheckout,
  storage: KeyValueStorage | null = defaultStorage(),
): boolean {
  if (!storage || !entityId) return false;
  try {
    storage.setItem(getPaystackCheckoutKey(entityId), JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export function loadPendingPaystackCheckout(
  entityId: string | null | undefined,
  storage: KeyValueStorage | null = defaultStorage(),
): PendingPaystackCheckout | null {
  if (!storage || !entityId) return null;
  try {
    const raw = storage.getItem(getPaystackCheckoutKey(entityId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isPendingPaystackCheckout(parsed) && parsed.actor === "business") return parsed;
  } catch {
    // Fall through and discard unreadable state.
  }
  clearPendingPaystackCheckout(entityId, storage);
  return null;
}

export function clearPendingPaystackCheckout(
  entityId: string | null | undefined,
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  if (!storage || !entityId) return;
  try {
    storage.removeItem(getPaystackCheckoutKey(entityId));
  } catch {
    // ignore storage errors
  }
}
