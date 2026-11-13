"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GetCardCollectionStatusApi } from "@/services/transactions";
import {
  CARD_POLL_WINDOW_MS,
  isRetryableStatusError,
  isTerminalViewState,
  isUnexpectedStatusCombination,
  mapCardCollectionError,
  nextPollDelay,
  paymentViewState,
  sanitizedErrorCode,
} from "@/lib/cardCollection";
import type {
  CardCollectionError,
  CardCollectionStatusResponse,
  CardPaymentProvider,
  CardPaymentViewState,
} from "@/types/cardCollection";
import type { CardFundingEventName } from "@/types/analytics";
import { trackCardFunding } from "@/utils/analytics/cardFunding";
import { trackMoneyMovementSuccess } from "@/utils/analytics/dataLayer";

export type CardPollingPhase =
  | "polling"
  | "timed_out"
  | "terminal"
  | "error";

const TERMINAL_EVENTS: Record<
  Exclude<CardPaymentViewState, "processing">,
  CardFundingEventName
> = {
  success: "card_funding_completed",
  failed: "card_funding_failed",
  review: "card_funding_review",
  disputed: "card_funding_disputed",
};

/**
 * Observes a Raiz collection reference: immediate request, every 3s while
 * pending, bounded backoff on network/5xx, and a 60s automatic window.
 */
export function useCardCollectionPolling(
  reference: string | null,
  provider: CardPaymentProvider | null,
) {
  const qc = useQueryClient();
  const [payment, setPayment] =
    useState<CardCollectionStatusResponse | null>(null);
  const [phase, setPhase] = useState<CardPollingPhase>("polling");
  const [error, setError] = useState<CardCollectionError | null>(null);
  const runIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const windowStartRef = useRef(0);
  const errorCountRef = useRef(0);
  const phaseRef = useRef<CardPollingPhase>("polling");

  const updatePhase = useCallback((next: CardPollingPhase) => {
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
      res: CardCollectionStatusResponse,
      view: Exclude<CardPaymentViewState, "processing">,
    ) => {
      const props = {
        provider: res.provider,
        collection_id: res.collection_id,
        reference: res.reference,
        principal_amount: res.principal_amount,
        fee_amount: res.fee_amount,
        total_amount: res.total_amount,
        status: res.status,
        settlement_status: res.settlement_status,
        polling_duration_ms: Date.now() - windowStartRef.current,
      };
      trackCardFunding(
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
      if (!reference || !provider) return;
      const schedule = (delay: number) => {
        if (
          Date.now() - windowStartRef.current + delay >
          CARD_POLL_WINDOW_MS
        ) {
          updatePhase("timed_out");
          return;
        }
        timerRef.current = setTimeout(() => void pollRef.current(runId), delay);
      };

      try {
        const res = await GetCardCollectionStatusApi(reference, provider);
        if (runId !== runIdRef.current) return;
        errorCountRef.current = 0;
        setPayment(res);
        const view = paymentViewState(res);
        trackCardFunding("card_funding_status_polled", {
          provider: res.provider,
          reference: res.reference,
          status: res.status,
          settlement_status: res.settlement_status,
          polling_duration_ms: Date.now() - windowStartRef.current,
        });
        if (isUnexpectedStatusCombination(res)) {
          console.warn("[card-funding]", {
            reference: res.reference,
            status: res.status,
            settlement_status: res.settlement_status,
          });
        }
        if (isTerminalViewState(view)) {
          updatePhase("terminal");
          handleTerminal(
            res,
            view as Exclude<CardPaymentViewState, "processing">,
          );
          return;
        }
        schedule(nextPollDelay(0));
      } catch (err) {
        if (runId !== runIdRef.current) return;
        const mapped = mapCardCollectionError(err);
        if (!isRetryableStatusError(mapped.status)) {
          console.warn("[card-funding]", {
            reference,
            error_code: sanitizedErrorCode(mapped),
            correlation_id: mapped.correlationId,
          });
          setError(mapped);
          updatePhase("error");
          return;
        }
        errorCountRef.current += 1;
        schedule(nextPollDelay(errorCountRef.current));
      }
    },
    [reference, provider, handleTerminal, updatePhase],
  );

  const pollRef = useRef(poll);
  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  const refresh = useCallback(() => {
    if (!reference || !provider) return;
    runIdRef.current += 1;
    clearTimer();
    windowStartRef.current = Date.now();
    errorCountRef.current = 0;
    setError(null);
    updatePhase("polling");
    void poll(runIdRef.current);
  }, [reference, provider, poll, updatePhase]);

  useEffect(() => {
    refresh();
    return () => {
      runIdRef.current += 1;
      clearTimer();
    };
  }, [refresh]);

  const viewState = payment ? paymentViewState(payment) : "processing";

  return { payment, viewState, phase, error, refresh };
}
