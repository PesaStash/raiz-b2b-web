"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@/lib/hooks/useUser";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { GetCardCollectionStatusApi } from "@/services/transactions";
import { isTerminalViewState, mapCardCollectionError, paymentViewState } from "@/lib/cardCollection";
import {
  clearPendingCardCheckout,
  isCardCheckoutStale,
  loadPendingCardCheckout,
} from "@/lib/cardCheckoutSession";
import { consumeCardCallbackReference, resolveCardCheckout } from "@/lib/cardCheckoutCallback";
import type { PendingCardCheckout } from "@/types/cardCollection";
import CardFundingStatus from "./CardFundingStatus";
import NgnCardTopUp from "./NgnCardTopUp";

const QUIET_CHECK_INTERVAL_MS = 30_000;

/**
 * Reopens the processing screen for a checkout started on this browser after
 * a reload, back navigation from the provider, or returning to the tab.
 * A checkout older than the resume window is checked quietly: a finished
 * payment is shown once, and one that is still pending is dropped.
 */
const CardCheckoutResume = () => {
  const { user } = useUser();
  const { canWriteBusiness } = usePermissions();
  const entityId = user?.business_account?.entity_id;
  const [checkout, setCheckout] = useState<PendingCardCheckout | null>(null);
  const [dismissedReference, setDismissedReference] = useState<string | null>(null);
  const [startNew, setStartNew] = useState(false);
  const lastQuietCheckRef = useRef(0);
  const callbackReferenceRef = useRef<string | null | undefined>(undefined);

  const resume = useCallback(async () => {
    if (!entityId) return;
    // Providers may redirect to any dashboard route (e.g. "/?reference=...").
    if (callbackReferenceRef.current === undefined) {
      callbackReferenceRef.current = consumeCardCallbackReference();
    }
    const callbackReference = callbackReferenceRef.current;
    if (callbackReference) {
      callbackReferenceRef.current = null;
      const record = await resolveCardCheckout(entityId, callbackReference);
      setCheckout(record);
      setDismissedReference(null);
      return;
    }

    const record = loadPendingCardCheckout(entityId);
    if (record && isCardCheckoutStale(record)) {
      setCheckout((current) => (current?.reference === record.reference ? null : current));
      if (Date.now() - lastQuietCheckRef.current < QUIET_CHECK_INTERVAL_MS) return;
      lastQuietCheckRef.current = Date.now();
      try {
        const status = await GetCardCollectionStatusApi(record.reference, record.provider);
        if (loadPendingCardCheckout(entityId)?.reference !== record.reference) return;
        if (status.status === "pending") {
          clearPendingCardCheckout(entityId);
          setCheckout((current) => (current?.reference === record.reference ? null : current));
          return;
        }
        setDismissedReference(null);
        setCheckout(record);
      } catch (error) {
        if (mapCardCollectionError(error).kind === "collection_not_found") {
          clearPendingCardCheckout(entityId);
        }
      }
      return;
    }

    setCheckout((current) =>
      // Keep a display-only record resolved from a callback until it is dismissed.
      !record && current && !current.wallet_id ? current : record,
    );
    if (!record || record.reference !== dismissedReference) return;

    // The user chose "Check later": only resurface once the result is final.
    if (Date.now() - lastQuietCheckRef.current < QUIET_CHECK_INTERVAL_MS) return;
    lastQuietCheckRef.current = Date.now();
    try {
      const status = await GetCardCollectionStatusApi(record.reference, record.provider);
      if (isTerminalViewState(paymentViewState(status))) setDismissedReference(null);
    } catch {
      // Status is rechecked on the next resume event.
    }
  }, [entityId, dismissedReference]);

  useEffect(() => {
    void resume();
    const onVisible = () => {
      if (document.visibilityState === "visible") void resume();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, [resume]);

  if (!entityId || !canWriteBusiness) return null;

  if (startNew) {
    return <NgnCardTopUp close={() => setStartNew(false)} />;
  }

  if (!checkout || checkout.reference === dismissedReference) return null;

  return (
    <CardFundingStatus
      key={checkout.reference}
      checkout={checkout}
      entityId={entityId}
      onClose={(acknowledged) => {
        if (acknowledged) {
          setCheckout(null);
          return;
        }
        lastQuietCheckRef.current = Date.now();
        setDismissedReference(checkout.reference);
      }}
      onStartNew={() => {
        setCheckout(null);
        setStartNew(true);
      }}
    />
  );
};

export default CardCheckoutResume;
