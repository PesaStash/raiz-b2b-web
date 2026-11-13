"use client";

import { GetCardCollectionStatusApi } from "@/services/transactions";
import {
  extractCardCallbackReference,
  providerFromReference,
  stripCardCallbackParams,
} from "@/lib/cardCollection";
import {
  loadPendingCardCheckout,
  pendingCheckoutFromStatus,
} from "@/lib/cardCheckoutSession";
import type { PendingCardCheckout } from "@/types/cardCollection";

/**
 * Reads the provider redirect reference from the current URL and removes the
 * provider parameters so they are not kept in history or page analytics.
 */
export function consumeCardCallbackReference(): string | null {
  if (typeof window === "undefined") return null;
  const { pathname, search, hash } = window.location;
  if (!search) return null;
  const reference = extractCardCallbackReference(search);
  const cleaned = stripCardCallbackParams(search);
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
export async function resolveCardCheckout(
  entityId: string,
  callbackReference: string | null,
): Promise<PendingCardCheckout | null> {
  const local = loadPendingCardCheckout(entityId);
  if (local || !callbackReference) return local;
  const provider = providerFromReference(callbackReference);
  if (!provider) return null;
  try {
    const status = await GetCardCollectionStatusApi(callbackReference, provider);
    return pendingCheckoutFromStatus(status);
  } catch {
    return null;
  }
}
