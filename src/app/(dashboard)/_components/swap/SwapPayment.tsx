"use client";
import EnterPin from "@/components/transactions/EnterPin";
import {
  BuyDollarApi,
  SellDollarApi,
  BuyStableCoinApi,
  SellStableCoinApi,
} from "@/services/transactions";
import { useSwapStore } from "@/store/Swap";
import { passwordHash } from "@/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { CurrencyTypeKey } from "@/store/Swap/swapSlice.types";

interface Props {
  goNext: () => void;
  setPaymentError: Dispatch<SetStateAction<string>>;
  close: () => void;
}

// API mapping based on swap direction
const getSwapAPI = (
  fromCurrency: CurrencyTypeKey,
  toCurrency: CurrencyTypeKey
) => {
  // NGN → USD (Buy Dollar)
  if (fromCurrency === "NGN" && toCurrency === "USD") {
    return {
      api: BuyDollarApi,
      currency: "NGN" as const,
    };
  }

  // USD → NGN (Sell Dollar)
  if (fromCurrency === "USD" && toCurrency === "NGN") {
    return {
      api: SellDollarApi,
      currency: "NGN" as const,
    };
  }

  // USD → SBC (Buy StableCoin)
  if (fromCurrency === "USD" && toCurrency === "SBC") {
    return {
      api: BuyStableCoinApi,
      currency: "USD" as const,
    };
  }

  // SBC → USD (Sell StableCoin)
  if (fromCurrency === "SBC" && toCurrency === "USD") {
    return {
      api: SellStableCoinApi,
      currency: "USD" as const,
    };
  }

  // Fallback (should never reach here due to validation)
  throw new Error(`Invalid swap pair: ${fromCurrency} → ${toCurrency}`);
};

const SwapPayment = ({ goNext, setPaymentError, close }: Props) => {
  const { swapFromCurrency, swapToCurrency, amount, actions } = useSwapStore();
  const [pin, setPin] = useState<string>("");
  const qc = useQueryClient();

  // Get the appropriate API and currency based on swap direction
  const { api: swapAPI, currency } = getSwapAPI(
    swapFromCurrency,
    swapToCurrency
  );

  const SwapMoneyMutation = useMutation({
    mutationFn: () =>
      swapAPI({
        amount: parseFloat(amount),
        currency: currency,
        transaction_pin: passwordHash(pin),
      }),
    onMutate: () => {
      actions.setStatus("loading");
      goNext();
    },
    onSuccess: (response) => {
      qc.refetchQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["transactions-report"] });

      if (response?.transaction_status?.transaction_status === "completed") {
        actions.setStatus("success");
      } else if (
        response?.transaction_status?.transaction_status === "pending"
      ) {
        actions.setStatus("pending");
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (response: any) => {
      actions.setStatus("failed");
      setPaymentError(
        response?.data?.message || "Swap failed. Please try again."
      );
    },
    onSettled: () => {
      goNext();
    },
  });

  const handleSend = () => {
    // Validate swap pair before proceeding
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
