"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import EnterPin from "@/components/transactions/EnterPin";
import {
  BuyDollarApi,
  SellDollarApi,
} from "@/services/transactions";
import {
  ExecuteSwapApi,
  isQuoteExpired,
  isSwapApiUnavailable,
} from "@/services/swap";
import type { SwapPairCurrency, SwapPreview, SwapExecuteResult } from "@/types/swap";
import {
  getTransactionId,
  trackMoneyMovementSuccess,
  trackTransactionFailed,
} from "@/utils/analytics/dataLayer";
import { getApiErrorMessage } from "@/utils/helpers";

interface Props {
  sourceCurrency: SwapPairCurrency;
  destinationCurrency: SwapPairCurrency;
  preview: SwapPreview;
  amount: string;
  close: () => void;
  onSuccess: (result: SwapExecuteResult) => void;
  onQuoteExpired: (error: unknown) => void;
  onNewQuote: () => void;
}

function firstMessage(value: unknown, depth = 0): string | undefined {
  if (depth > 4 || value == null) return undefined;
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstMessage(item, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) {
      const found = firstMessage(item, depth + 1);
      if (found) return found;
    }
  }
  return undefined;
}

function swapErrorMessage(error: unknown): string {
  const fallback = "Swap failed. Please try again.";
  const message = getApiErrorMessage(error, fallback);
  const generic =
    message === fallback ||
    message.startsWith("We could not validate that request");
  if (!generic) return message;
  const value = (error ?? {}) as {
    data?: unknown;
    response?: { data?: unknown };
  };
  const data = value.response?.data ?? value.data;
  return firstMessage(data) ?? message;
}

export default function GlobalSwapPayment({
  sourceCurrency,
  destinationCurrency,
  preview,
  amount,
  close,
  onSuccess,
  onQuoteExpired,
  onNewQuote,
}: Props) {
  const [pin, setPin] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const submitted = useRef(false);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (preview.mode === "v2" && preview.quoteId) {
        try {
          return await ExecuteSwapApi(
            {
              quote_id: preview.quoteId,
              transaction_pin: pin,
            },
            crypto.randomUUID(),
          );
        } catch (error) {
          if (isQuoteExpired(error)) {
            onQuoteExpired(error);
            throw error;
          }
          if (!isSwapApiUnavailable(error)) throw error;
        }
      }

      const api = sourceCurrency === "NGN" ? BuyDollarApi : SellDollarApi;
      return api({
        amount: parseFloat(amount),
        currency: "NGN",
        transaction_pin: pin,
      }) as Promise<SwapExecuteResult>;
    },
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["transactions-report"] });
      qc.invalidateQueries({ queryKey: ["income-expense-chart"] });

      const status =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (response as any)?.transaction_status?.transaction_status ||
        response?.status ||
        "completed";

      if (status === "failed") {
        setErrorMessage("Swap failed. Please try again.");
        setAttempt((value) => value + 1);
        return;
      }

      const transactionId = getTransactionId(response);
      if (transactionId) {
        trackMoneyMovementSuccess({
          event: "swap_completed",
          transactionId,
          value: parseFloat(amount) || 0,
          currency: sourceCurrency,
          extra: {
            from_currency: sourceCurrency,
            to_currency: destinationCurrency,
          },
        });
      }
      onSuccess(response);
    },
    onError: (error: unknown) => {
      submitted.current = false;
      setPin("");
      if (isQuoteExpired(error)) return;
      const message = swapErrorMessage(error);
      setErrorMessage(message);
      setAttempt((value) => value + 1);
      trackTransactionFailed({
        transactionType: "swap",
        error,
        value: parseFloat(amount) || undefined,
        currency: sourceCurrency,
      });
    },
  });

  useEffect(() => {
    if (pin.length === 4 && !submitted.current && !mutation.isPending) {
      submitted.current = true;
      setErrorMessage("");
      mutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <EnterPin
      key={attempt}
      pin={pin}
      setPin={setPin}
      close={close}
      disabled={mutation.isPending}
      error={errorMessage}
      onNewQuote={onNewQuote}
    />
  );
}
