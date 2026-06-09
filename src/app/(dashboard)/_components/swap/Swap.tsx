"use client";
import React, { useEffect, useState } from "react";
import SwapDetail from "./SwapDetail";
import SwapConfirmation from "./SwapConfirmation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  GetExchangeRate,
  GetIntTransactionFeeApi,
} from "@/services/transactions";
import { useSwapStore } from "@/store/Swap";
import { ACCOUNT_CURRENCIES } from "@/constants/misc";
import SwapPayment from "./SwapPayment";
import SwapStatusModal from "./SwapStatusModal";
import { useUser } from "@/lib/hooks/useUser";
import { formatAmount } from "@/utils/helpers";
// import RaizReceipt from "@/components/transactions/RaizReceipt";

export type SwapStep = "detail" | "confirmation" | "pay" | "status" | "receipt";

interface Props {
  close: () => void;
}

const Swap = ({ close }: Props) => {
  const { user } = useUser();
  const [step, setStep] = useState<SwapStep>("detail");
  const [timeLeft, setTimeLeft] = useState<number>(119);
  const { amount, swapToCurrency, status, actions, swapFromCurrency } =
    useSwapStore();
  const [paymentError, setPaymentError] = useState("");

  const isUsdSbcSwap =
    (swapFromCurrency === ACCOUNT_CURRENCIES.USD.name &&
      swapToCurrency === ACCOUNT_CURRENCIES.SBC.name) ||
    (swapFromCurrency === ACCOUNT_CURRENCIES.SBC.name &&
      swapToCurrency === ACCOUNT_CURRENCIES.USD.name);

  const rateCurrency =
    swapFromCurrency === ACCOUNT_CURRENCIES.USD.name
      ? swapToCurrency
      : swapFromCurrency;

  const {
    data: exchangeRateData,
    isLoading,
    refetch,
    isFetching,
    isError: exchangeRateError,
  } = useQuery({
    queryKey: ["exchange-rate", rateCurrency],
    queryFn: () => GetExchangeRate(rateCurrency),
    staleTime: 1000 * 60, // 1 minute
    retry: 2,
    enabled: !isUsdSbcSwap,
  });

  useEffect(() => {
    if (exchangeRateError) {
      toast.error("Failed to fetch exchange rate. Please try again later.");
    }
  }, [exchangeRateError]);

  useEffect(() => {
    if (exchangeRateData) {
      setTimeLeft(119);
    }
  }, [exchangeRateData]);

  useEffect(() => {
    if (timeLeft === 0) {
      toast.info("Updating... Getting latest prices");
      refetch();
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, refetch]);

  const getRate = () => {
    // USD <-> SBC: fixed 1:1 rate, no API needed
    if (
      (swapFromCurrency === ACCOUNT_CURRENCIES.USD.name &&
        swapToCurrency === ACCOUNT_CURRENCIES.SBC.name) ||
      (swapFromCurrency === ACCOUNT_CURRENCIES.SBC.name &&
        swapToCurrency === ACCOUNT_CURRENCIES.USD.name)
    ) {
      return 1;
    }

    // Selling USD → foreign currency: use sell_rate
    if (
      swapToCurrency === ACCOUNT_CURRENCIES.NGN.name ||
      swapToCurrency === ACCOUNT_CURRENCIES.GBP.name ||
      swapToCurrency === ACCOUNT_CURRENCIES.EUR.name
    ) {
      return exchangeRateData?.sell_rate || 0;
    }

    // Buying USD with foreign currency: use buy_rate
    if (swapToCurrency === ACCOUNT_CURRENCIES.USD.name) {
      return exchangeRateData?.buy_rate || 0;
    }

    if (swapToCurrency === ACCOUNT_CURRENCIES.SBC.name) {
      return 1;
    }
  };

  const rate = getRate();

  const getRecipientAmount = () => {
    const safeAmount = Number(amount || 0);

    // USD <-> SBC: fixed 1:1, no API needed
    if (
      (swapFromCurrency === ACCOUNT_CURRENCIES.USD.name &&
        swapToCurrency === ACCOUNT_CURRENCIES.SBC.name) ||
      (swapFromCurrency === ACCOUNT_CURRENCIES.SBC.name &&
        swapToCurrency === ACCOUNT_CURRENCIES.USD.name)
    ) {
      return formatAmount(safeAmount);
    }

    if (!exchangeRateData) return "0.00";

    // USD → foreign currency: amount × sell_rate
    if (
      swapToCurrency === ACCOUNT_CURRENCIES.NGN.name ||
      swapToCurrency === ACCOUNT_CURRENCIES.GBP.name ||
      swapToCurrency === ACCOUNT_CURRENCIES.EUR.name
    ) {
      return (
        Number(safeAmount * Number(exchangeRateData.sell_rate)).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        ) || "1.00"
      );
    }

    // Foreign currency → USD: amount / buy_rate (i.e. amount × (1/buy_rate))
    if (swapToCurrency === ACCOUNT_CURRENCIES.USD.name) {
      return (
        Number(safeAmount / Number(exchangeRateData.buy_rate)).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        ) || "1.00"
      );
    }

    return formatAmount(safeAmount);
  };

  const recipientAmount = getRecipientAmount();

  const handleDone = () => {
    actions.reset(user);
    close();
  };

  const { data: cryptoFee, isLoading: cryptoFeeLoading } = useQuery({
    queryKey: ["transactions-fee", amount],
    queryFn: () => GetIntTransactionFeeApi(Number(amount), "CRYPTO_SWAP"),
    enabled: !!amount,
  });

  const displayScreen = () => {
    switch (step) {
      case "detail":
        return (
          <SwapDetail
            close={close}
            goNext={() => {
              if (!isUsdSbcSwap && (exchangeRateError || !exchangeRateData)) {
                toast.error("Exchange rate unavailable. Cannot proceed.");
                return;
              }
              setStep("confirmation");
            }}
            exchangeRate={rate}
            recipientAmount={recipientAmount}
            timeLeft={timeLeft}
            loading={isLoading || isFetching || cryptoFeeLoading}
            cryptoFee={cryptoFee}
          />
        );
      case "confirmation":
        return (
          <>
            <SwapDetail
              close={close}
              goNext={() => {
                setStep("confirmation");
              }}
              exchangeRate={rate}
              recipientAmount={recipientAmount}
              timeLeft={timeLeft}
              loading={isLoading}
              cryptoFee={cryptoFee}
            />
            <SwapConfirmation
              goBack={() => setStep("detail")}
              goNext={() => {
                if (!isUsdSbcSwap && (exchangeRateError || !exchangeRateData)) {
                  toast.error("Exchange rate unavailable. Cannot proceed.");
                  return;
                }
                setStep("pay");
              }}
              exchangeRate={rate}
              recipientAmount={recipientAmount}
              timeLeft={timeLeft}
              loading={isLoading}
              cryptoFee={cryptoFee}
            />
          </>
        );
      case "pay":
        return (
          <>
            <SwapDetail
              close={close}
              goNext={() => {
                setStep("confirmation");
              }}
              exchangeRate={rate}
              recipientAmount={recipientAmount}
              timeLeft={timeLeft}
              loading={isLoading}
              cryptoFee={cryptoFee}
            />
            <SwapPayment
              goNext={() => setStep("status")}
              close={() => setStep("confirmation")}
              setPaymentError={setPaymentError}
            />
          </>
        );
      case "status":
        return (
          <>
            <SwapDetail
              close={close}
              goNext={() => {
                setStep("confirmation");
              }}
              exchangeRate={rate}
              recipientAmount={recipientAmount}
              timeLeft={timeLeft}
              loading={isLoading}
            />
            <SwapStatusModal
              status={status}
              close={handleDone}
              error={paymentError}
              tryAgain={() => setStep("confirmation")}
              viewReceipt={() => setStep("receipt")}
            />
          </>
        );

      default:
        break;
    }
  };

  return <div>{displayScreen()}</div>;
};

export default Swap;
