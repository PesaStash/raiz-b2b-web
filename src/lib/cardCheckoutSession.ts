import type {
  CardCollectionInitializeResponse,
  CardCollectionStatusResponse,
  CardPaymentProvider,
  PendingCardCheckout,
} from "@/types/cardCollection";

const KEY_PREFIX = "raiz:ngn-card-checkout:";
/** Legacy key from the Paystack-only integration; still read and migrated. */
const LEGACY_KEY_PREFIX = "raiz:paystack-ngn-checkout:";

type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): KeyValueStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const getCardCheckoutKey = (entityId: string) => `${KEY_PREFIX}${entityId}`;
export const getLegacyCardCheckoutKey = (entityId: string) =>
  `${LEGACY_KEY_PREFIX}${entityId}`;

/** Copies only the contract's recovery fields; the checkout URL is never persisted. */
export function buildPendingCardCheckout(
  response: CardCollectionInitializeResponse,
  walletId: string,
  now: Date = new Date(),
): PendingCardCheckout {
  return {
    provider: response.provider,
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
  status: CardCollectionStatusResponse,
  now: Date = new Date(),
): PendingCardCheckout {
  return {
    provider: status.provider,
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

function isPendingCardCheckout(value: unknown): value is PendingCardCheckout {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const required = [
    "collection_id",
    "reference",
    "wallet_id",
    "principal_amount",
    "fee_amount",
    "total_amount",
    "started_at",
  ];
  if (
    !(record.actor === "business" || record.actor === "personal") ||
    !required.every(
      (field) => typeof record[field] === "string" && (record[field] as string).length > 0,
    )
  ) {
    return false;
  }
  if (record.provider === undefined) return true;
  return record.provider === "paystack" || record.provider === "flutterwave";
}

function withDefaultProvider(record: PendingCardCheckout): PendingCardCheckout {
  if (record.provider) return record;
  return { ...record, provider: "paystack" as CardPaymentProvider };
}

export function savePendingCardCheckout(
  entityId: string,
  record: PendingCardCheckout,
  storage: KeyValueStorage | null = defaultStorage(),
): boolean {
  if (!storage || !entityId) return false;
  try {
    storage.setItem(getCardCheckoutKey(entityId), JSON.stringify(record));
    storage.removeItem(getLegacyCardCheckoutKey(entityId));
    return true;
  } catch {
    return false;
  }
}

export function loadPendingCardCheckout(
  entityId: string | null | undefined,
  storage: KeyValueStorage | null = defaultStorage(),
): PendingCardCheckout | null {
  if (!storage || !entityId) return null;
  try {
    const current = storage.getItem(getCardCheckoutKey(entityId));
    if (current) {
      const parsed: unknown = JSON.parse(current);
      if (isPendingCardCheckout(parsed) && parsed.actor === "business") {
        return withDefaultProvider(parsed);
      }
      clearPendingCardCheckout(entityId, storage);
      return null;
    }

    const legacy = storage.getItem(getLegacyCardCheckoutKey(entityId));
    if (!legacy) return null;
    const parsed: unknown = JSON.parse(legacy);
    if (isPendingCardCheckout(parsed) && parsed.actor === "business") {
      const migrated = withDefaultProvider(parsed);
      savePendingCardCheckout(entityId, migrated, storage);
      return migrated;
    }
    clearPendingCardCheckout(entityId, storage);
  } catch {
    clearPendingCardCheckout(entityId, storage);
  }
  return null;
}

export function clearPendingCardCheckout(
  entityId: string | null | undefined,
  storage: KeyValueStorage | null = defaultStorage(),
): void {
  if (!storage || !entityId) return;
  try {
    storage.removeItem(getCardCheckoutKey(entityId));
    storage.removeItem(getLegacyCardCheckoutKey(entityId));
  } catch {
    // ignore storage errors
  }
}
