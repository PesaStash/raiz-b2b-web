"use client";

import { GetPaystackCardCollectionStatusApi } from "@/services/transactions";
import {
  extractPaystackCallbackReference,
  stripPaystackCallbackParams,
} from "@/lib/paystackCardCollection";
import {
  loadPendingPaystackCheckout,
  pendingCheckoutFromStatus,
} from "@/lib/paystackCheckoutSession";
import type { PendingPaystackCheckout } from "@/types/paystackCardCollection";

/**
 * Reads Paystack's redirect reference from the current URL and removes the
 * provider parameters so they are not kept in history or page analytics.
 */
export function consumePaystackCallbackReference(): string | null {
  if (typeof window === "undefined") return null;
  const { pathname, search, hash } = window.location;
  if (!search) return null;
  const reference = extractPaystackCallbackReference(search);
  const cleaned = stripPaystackCallbackParams(search);
  if (cleaned !== search) {
    window.history.replaceState(window.history.state, "", `${pathname}${cleaned}${hash}`);
  }
  return reference;
}

/**
 * The locally stored checkout always wins. Without one (checkout started in
 * another browser or on another host), fall back to the entity-scoped status
 * endpoint, which returns 404 for references the business does not own.
 */
export async function resolvePaystackCheckout(
  entityId: string,
  callbackReference: string | null,
): Promise<PendingPaystackCheckout | null> {
  const local = loadPendingPaystackCheckout(entityId);
  if (local || !callbackReference) return local;
  try {
    const status = await GetPaystackCardCollectionStatusApi(callbackReference);
    return pendingCheckoutFromStatus(status);
  } catch {
    return null;
  }
}
