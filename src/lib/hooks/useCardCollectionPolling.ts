"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GetPaystackCardCollectionStatusApi } from "@/services/transactions";
import {
  PAYSTACK_POLL_WINDOW_MS,
  isRetryableStatusError,
  isTerminalViewState,
  isUnexpectedStatusCombination,
  mapPaystackCollectionError,
  nextPollDelay,
  paymentViewState,
  sanitizedErrorCode,
} from "@/lib/paystackCardCollection";
import type {
  PaystackCardCollectionStatusResponse,
  PaystackCollectionError,
  PaystackPaymentViewState,
} from "@/types/paystackCardCollection";
import type { PaystackFundingEventName } from "@/types/analytics";
import { trackPaystackFunding } from "@/utils/analytics/paystackFunding";
import { trackMoneyMovementSuccess } from "@/utils/analytics/dataLayer";

export type PaystackPollingPhase =
  | "polling"
  | "timed_out"
  | "terminal"
  | "error";

const TERMINAL_EVENTS: Record<
  Exclude<PaystackPaymentViewState, "processing">,
  PaystackFundingEventName
> = {
  success: "paystack_card_funding_completed",
  failed: "paystack_card_funding_failed",
  review: "paystack_card_funding_review",
  disputed: "paystack_card_funding_disputed",
};

/**
 * Observes a Raiz collection reference: immediate request, every 3s while
 * pending, bounded backoff on network/5xx, and a 60s automatic window.
 */
export function usePaystackCollectionPolling(reference: string | null) {
  const qc = useQueryClient();
  const [payment, setPayment] =
    useState<PaystackCardCollectionStatusResponse | null>(null);
  const [phase, setPhase] = useState<PaystackPollingPhase>("polling");
  const [error, setError] = useState<PaystackCollectionError | null>(null);
  const runIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const windowStartRef = useRef(0);
  const errorCountRef = useRef(0);
  const phaseRef = useRef<PaystackPollingPhase>("polling");

  const updatePhase = useCallback((next: PaystackPollingPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTerminal = useCallback(
    (
      res: PaystackCardCollectionStatusResponse,
      view: Exclude<PaystackPaymentViewState, "processing">,
    ) => {
      const props = {
        collection_id: res.collection_id,
        reference: res.reference,
        principal_amount: res.principal_amount,
        fee_amount: res.fee_amount,
        total_amount: res.total_amount,
        status: res.status,
        settlement_status: res.settlement_status,
        polling_duration_ms: Date.now() - windowStartRef.current,
      };
      trackPaystackFunding(
        TERMINAL_EVENTS[view],
        props,
        `${TERMINAL_EVENTS[view]}:${res.reference}`,
      );
      if (view === "success") {
        qc.invalidateQueries({ queryKey: ["user"] });
        qc.invalidateQueries({ queryKey: ["transactions-report"] });
        trackMoneyMovementSuccess({
          event: "topup_completed",
          transactionId: res.transaction_report_id || res.reference,
          value: Number(res.principal_amount),
          currency: "NGN",
          extra: { funding_method: "card" },
        });
      }
    },
    [qc],
  );

  const poll = useCallback(
    async (runId: number) => {
      if (!reference) return;
      const schedule = (delay: number) => {
        if (
          Date.now() - windowStartRef.current + delay >
          PAYSTACK_POLL_WINDOW_MS
        ) {
          updatePhase("timed_out");
          return;
        }
        timerRef.current = setTimeout(() => void pollRef.current(runId), delay);
      };

      try {
        const res = await GetPaystackCardCollectionStatusApi(reference);
        if (runId !== runIdRef.current) return;
        errorCountRef.current = 0;
        setPayment(res);
        const view = paymentViewState(res);
        trackPaystackFunding("paystack_card_funding_status_polled", {
          reference: res.reference,
          status: res.status,
          settlement_status: res.settlement_status,
          polling_duration_ms: Date.now() - windowStartRef.current,
        });
        if (isUnexpectedStatusCombination(res)) {
          console.warn("[paystack-card-funding]", {
            reference: res.reference,
            status: res.status,
            settlement_status: res.settlement_status,
          });
        }
        if (isTerminalViewState(view)) {
          updatePhase("terminal");
          handleTerminal(
            res,
            view as Exclude<PaystackPaymentViewState, "processing">,
          );
          return;
        }
        schedule(nextPollDelay(0));
      } catch (err) {
        if (runId !== runIdRef.current) return;
        const mapped = mapPaystackCollectionError(err);
        if (!isRetryableStatusError(mapped.status)) {
          console.warn("[paystack-card-funding]", {
            reference,
            error_code: sanitizedErrorCode(mapped),
          });
          setError(mapped);
          updatePhase("error");
          return;
        }
        errorCountRef.current += 1;
        schedule(nextPollDelay(errorCountRef.current));
      }
    },
    [reference, handleTerminal, updatePhase],
  );

  const pollRef = useRef(poll);
  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  const refresh = useCallback(() => {
    if (!reference) return;
    runIdRef.current += 1;
    clearTimer();
    windowStartRef.current = Date.now();
    errorCountRef.current = 0;
    setError(null);
    updatePhase("polling");
    void poll(runIdRef.current);
  }, [reference, poll, updatePhase]);

  useEffect(() => {
    refresh();
    return () => {
      runIdRef.current += 1;
      clearTimer();
    };
  }, [refresh]);

  useEffect(() => {
    const resume = () => {
      if (document.visibilityState !== "visible") return;
      if (phaseRef.current === "timed_out") refresh();
    };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("pageshow", resume);
    return () => {
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("pageshow", resume);
    };
  }, [refresh]);

  const viewState: PaystackPaymentViewState = payment
    ? paymentViewState(payment)
    : "processing";

  return { payment, viewState, phase, error, refresh };
}
