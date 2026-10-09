"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@/lib/hooks/useUser";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { GetPaystackCardCollectionStatusApi } from "@/services/transactions";
import { isTerminalViewState, paymentViewState } from "@/lib/paystackCardCollection";
import { loadPendingPaystackCheckout } from "@/lib/paystackCheckoutSession";
import { consumePaystackCallbackReference, resolvePaystackCheckout } from "@/lib/paystackCallback";
import type { PendingPaystackCheckout } from "@/types/paystackCardCollection";
import PaystackFundingStatus from "./PaystackFundingStatus";
import PaystackCardTopUp from "./PaystackCardTopUp";

const QUIET_CHECK_INTERVAL_MS = 30_000;

/**
 * Reopens the processing screen for a checkout started on this browser after
 * a reload, back navigation from Paystack, or returning to the tab.
 */
const PaystackCheckoutResume = () => {
  const { user } = useUser();
  const { canWriteBusiness } = usePermissions();
  const entityId = user?.business_account?.entity_id;
  const [checkout, setCheckout] = useState<PendingPaystackCheckout | null>(null);
  const [dismissedReference, setDismissedReference] = useState<string | null>(null);
  const [startNew, setStartNew] = useState(false);
  const lastQuietCheckRef = useRef(0);
  const callbackReferenceRef = useRef<string | null | undefined>(undefined);

  const resume = useCallback(async () => {
    if (!entityId) return;
    // Paystack may redirect to any dashboard route (e.g. "/?reference=...").
    if (callbackReferenceRef.current === undefined) {
      callbackReferenceRef.current = consumePaystackCallbackReference();
    }
    const callbackReference = callbackReferenceRef.current;
    if (callbackReference) {
      callbackReferenceRef.current = null;
      const record = await resolvePaystackCheckout(entityId, callbackReference);
      setCheckout(record);
      setDismissedReference(null);
      return;
    }

    const record = loadPendingPaystackCheckout(entityId);
    setCheckout((current) =>
      // Keep a display-only record resolved from a callback until it is dismissed.
      !record && current && !current.wallet_id ? current : record,
    );
    if (!record || record.reference !== dismissedReference) return;

    // The user chose "Check later": only resurface once the result is final.
    if (Date.now() - lastQuietCheckRef.current < QUIET_CHECK_INTERVAL_MS) return;
    lastQuietCheckRef.current = Date.now();
    try {
      const status = await GetPaystackCardCollectionStatusApi(record.reference);
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
    return <PaystackCardTopUp close={() => setStartNew(false)} />;
  }

  if (!checkout || checkout.reference === dismissedReference) return null;

  return (
    <PaystackFundingStatus
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

export default PaystackCheckoutResume;
