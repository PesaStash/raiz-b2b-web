"use client";
import EnterPin from "@/components/transactions/EnterPin";
import {
  BuyDollarApi,
  SellDollarApi,
  BuyStableCoinApi,
  SellStableCoinApi,
  CrossCurrencySwapApi,
} from "@/services/transactions";
import { useSwapStore } from "@/store/Swap";
import {
  getTransactionId,
  trackMoneyMovementSuccess,
  trackTransactionFailed,
} from "@/utils/analytics/dataLayer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  CurrencyTypeKey,
  isCrossCurrencyNgnGbpEurSwap,
} from "@/store/Swap/swapSlice.types";
import { ICrossCurrencies } from "@/types/misc";
import { ISwapPayload } from "@/types/services";

interface Props {
  goNext: () => void;
  setPaymentError: Dispatch<SetStateAction<string>>;
  close: () => void;
}

type SwapApiFn = (payload: ISwapPayload) => Promise<unknown>;

// API mapping based on swap direction
const getSwapAPI = (
  fromCurrency: CurrencyTypeKey,
  toCurrency: CurrencyTypeKey,
): { api: SwapApiFn; currency: ISwapPayload["currency"] } => {
  if (fromCurrency === "NGN" && toCurrency === "USD") {
    return { api: BuyDollarApi, currency: "NGN" };
  }

  if (fromCurrency === "USD" && toCurrency === "NGN") {
    return { api: SellDollarApi, currency: "NGN" };
  }

  if (fromCurrency === "GBP" && toCurrency === "USD") {
    return { api: BuyDollarApi, currency: "GBP" };
  }

  if (fromCurrency === "USD" && toCurrency === "GBP") {
    return { api: SellDollarApi, currency: "GBP" };
  }

  if (fromCurrency === "EUR" && toCurrency === "USD") {
    return { api: BuyDollarApi, currency: "EUR" };
  }

  if (fromCurrency === "USD" && toCurrency === "EUR") {
    return { api: SellDollarApi, currency: "EUR" };
  }

  if (fromCurrency === "USD" && toCurrency === "SBC") {
    return { api: BuyStableCoinApi, currency: "USD" };
  }

  if (fromCurrency === "SBC" && toCurrency === "USD") {
    return { api: SellStableCoinApi, currency: "USD" };
  }

  throw new Error(`Invalid swap pair: ${fromCurrency} → ${toCurrency}`);
};

const getSwapErrorMessage = (error: unknown): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const axiosError = error as any;
  const status = axiosError?.response?.status;
  const data = axiosError?.response?.data;

  if (status === 503) {
    return "Rate unavailable. Please try again later.";
  }

  return (
    data?.detail ||
    data?.message ||
    "Swap failed. Please try again."
  );
};

const SwapPayment = ({ goNext, setPaymentError, close }: Props) => {
  const { swapFromCurrency, swapToCurrency, amount, actions } = useSwapStore();
  const [pin, setPin] = useState<string>("");
  const qc = useQueryClient();

  const isCrossCurrencySwap = isCrossCurrencyNgnGbpEurSwap(
    swapFromCurrency,
    swapToCurrency,
  );

  const SwapMoneyMutation = useMutation({
    mutationFn: () => {
      if (isCrossCurrencySwap) {
        return CrossCurrencySwapApi({
          amount: parseFloat(amount),
          from_currency: swapFromCurrency as ICrossCurrencies,
          to_currency: swapToCurrency as ICrossCurrencies,
          transaction_pin: pin,
          reward_quote_id: null,
        });
      }

      const { api: swapAPI, currency } = getSwapAPI(
        swapFromCurrency,
        swapToCurrency,
      );

      return swapAPI({
        amount: parseFloat(amount),
        currency,
        transaction_pin: pin,
      });
    },
    onMutate: () => {
      actions.setStatus("loading");
      goNext();
    },
    onSuccess: (response) => {
      qc.refetchQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["transactions-report"] });
      qc.invalidateQueries({ queryKey: ["income-expense-chart"] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const report = response as any;
      if (report?.transaction_status?.transaction_status === "completed") {
        actions.setStatus("success");
        const transactionId = getTransactionId(response);
        if (transactionId) {
          trackMoneyMovementSuccess({
            event: "swap_completed",
            transactionId,
            value: parseFloat(amount) || 0,
            currency: swapFromCurrency,
            extra: {
              from_currency: swapFromCurrency,
              to_currency: swapToCurrency,
              amount_out:
                typeof report?.transaction_amount === "number" &&
                report.currency === swapToCurrency
                  ? report.transaction_amount
                  : undefined,
            },
          });
        }
      } else if (report?.transaction_status?.transaction_status === "pending") {
        actions.setStatus("pending");
      }
    },
    onError: (error: unknown) => {
      actions.setStatus("failed");
      setPaymentError(getSwapErrorMessage(error));
      trackTransactionFailed({
        transactionType: "swap",
        error,
        value: parseFloat(amount) || undefined,
        currency: swapFromCurrency,
      });
    },
    onSettled: () => {
      goNext();
    },
  });

  const handleSend = () => {
    if (!actions.isValidSwapPair(swapFromCurrency, swapToCurrency)) {
      setPaymentError("Invalid swap pair. This swap is not allowed.");
      actions.setStatus("failed");
      goNext();
      return;
    }

    SwapMoneyMutation.mutate();
  };

  useEffect(() => {
    if (pin.length === 4) {
      handleSend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return <EnterPin pin={pin} setPin={setPin} close={close} />;
};

export default SwapPayment;
