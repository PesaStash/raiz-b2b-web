"use client";
import React, { useEffect, useRef, useState } from "react";
import SwapDetail from "./SwapDetail";
import SwapConfirmation from "./SwapConfirmation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  GetCrossCurrencySwapRateApi,
  GetExchangeRate,
  GetIntTransactionFeeApi,
} from "@/services/transactions";
import { useSwapStore } from "@/store/Swap";
import { ACCOUNT_CURRENCIES } from "@/constants/misc";
import SwapPayment from "./SwapPayment";
import SwapStatusModal from "./SwapStatusModal";
import { useUser } from "@/lib/hooks/useUser";
import { formatAmount } from "@/utils/helpers";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { isCrossCurrencyNgnGbpEurSwap } from "@/store/Swap/swapSlice.types";
import { ICrossCurrencies } from "@/types/misc";
// import RaizReceipt from "@/components/transactions/RaizReceipt";

export type SwapStep = "detail" | "confirmation" | "pay" | "status" | "receipt";

interface Props {
  close: () => void;
}

const CROSS_CURRENCY_QUOTE_MAX_AGE_MS = 30_000;
const CROSS_CURRENCY_TIMER_SECONDS = 119

const Swap = ({ close }: Props) => {
  const { user } = useUser();
  const [step, setStep] = useState<SwapStep>("detail");
  const [timeLeft, setTimeLeft] = useState<number>(119);
  const { amount, swapToCurrency, status, actions, swapFromCurrency } =
    useSwapStore();
  const [paymentError, setPaymentError] = useState("");
  const quoteFetchedAtRef = useRef<number | null>(null);

  const isUsdSbcSwap =
    (swapFromCurrency === ACCOUNT_CURRENCIES.USD.name &&
      swapToCurrency === ACCOUNT_CURRENCIES.SBC.name) ||
    (swapFromCurrency === ACCOUNT_CURRENCIES.SBC.name &&
      swapToCurrency === ACCOUNT_CURRENCIES.USD.name);

  const isCrossCurrencySwap = isCrossCurrencyNgnGbpEurSwap(
    swapFromCurrency,
    swapToCurrency,
  );

  const debouncedAmount = useDebounce(amount, 400);
  const parsedDebouncedAmount = Number(debouncedAmount || 0);

  const rateCurrency =
    swapFromCurrency === ACCOUNT_CURRENCIES.USD.name
      ? swapToCurrency
      : swapFromCurrency;

  const {
    data: exchangeRateData,
    isLoading: exchangeRateLoading,
    refetch: refetchExchangeRate,
    isFetching: exchangeRateFetching,
    isError: exchangeRateError,
  } = useQuery({
    queryKey: ["exchange-rate", rateCurrency],
    queryFn: () => GetExchangeRate(rateCurrency),
    staleTime: 1000 * 60,
    retry: 2,
    enabled: !isUsdSbcSwap && !isCrossCurrencySwap,
  });

  const {
    data: crossCurrencyQuoteData,
    isLoading: crossCurrencyQuoteLoading,
    refetch: refetchCrossCurrencyQuote,
    isFetching: crossCurrencyQuoteFetching,
    isError: crossCurrencyQuoteError,
  } = useQuery({
    queryKey: [
      "cross-currency-swap-rate",
      swapFromCurrency,
      swapToCurrency,
      parsedDebouncedAmount,
    ],
    queryFn: () =>
      GetCrossCurrencySwapRateApi({
        from_currency: swapFromCurrency as ICrossCurrencies,
        to_currency: swapToCurrency as ICrossCurrencies,
        amount: parsedDebouncedAmount,
      }),
    staleTime: CROSS_CURRENCY_QUOTE_MAX_AGE_MS,
    retry: 2,
    enabled:
      isCrossCurrencySwap && parsedDebouncedAmount > 0 && !!debouncedAmount,
  });

  const isRateLoading = isCrossCurrencySwap
    ? crossCurrencyQuoteLoading || crossCurrencyQuoteFetching
    : exchangeRateLoading || exchangeRateFetching;

  const isRateError = isCrossCurrencySwap
    ? crossCurrencyQuoteError
    : exchangeRateError;

  const hasRateData = isCrossCurrencySwap
    ? !!crossCurrencyQuoteData
    : isUsdSbcSwap || !!exchangeRateData;

  const refetchRate = isCrossCurrencySwap
    ? refetchCrossCurrencyQuote
    : refetchExchangeRate;

  useEffect(() => {
    if (isRateError) {
      toast.error("Failed to fetch exchange rate. Please try again later.");
    }
  }, [isRateError]);

  useEffect(() => {
    if (exchangeRateData || crossCurrencyQuoteData) {
      quoteFetchedAtRef.current = Date.now();
      setTimeLeft(isCrossCurrencySwap ? CROSS_CURRENCY_TIMER_SECONDS : 119);
    }
  }, [exchangeRateData, crossCurrencyQuoteData, isCrossCurrencySwap]);

  useEffect(() => {
    if (timeLeft === 0) {
      toast.info("Updating... Getting latest prices");
      refetchRate().finally(() => {
        quoteFetchedAtRef.current = Date.now();
        setTimeLeft(
          isCrossCurrencySwap ? CROSS_CURRENCY_TIMER_SECONDS : 119,
        );
      });
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, refetchRate, isCrossCurrencySwap]);

  const getRate = () => {
    if (isCrossCurrencySwap) {
      return crossCurrencyQuoteData?.derived_rate || 0;
    }

    if (
      (swapFromCurrency === ACCOUNT_CURRENCIES.USD.name &&
        swapToCurrency === ACCOUNT_CURRENCIES.SBC.name) ||
      (swapFromCurrency === ACCOUNT_CURRENCIES.SBC.name &&
        swapToCurrency === ACCOUNT_CURRENCIES.USD.name)
    ) {
      return 1;
    }

    if (
      swapToCurrency === ACCOUNT_CURRENCIES.NGN.name ||
      swapToCurrency === ACCOUNT_CURRENCIES.GBP.name ||
      swapToCurrency === ACCOUNT_CURRENCIES.EUR.name
    ) {
      return exchangeRateData?.sell_rate || 0;
    }

    if (swapToCurrency === ACCOUNT_CURRENCIES.USD.name) {
      return exchangeRateData?.buy_rate || 0;
    }

    if (swapToCurrency === ACCOUNT_CURRENCIES.SBC.name) {
      return 1;
    }
  };

  const getInverseRate = (): number | undefined => {
    if (isCrossCurrencySwap) {
      return crossCurrencyQuoteData?.inverse_derived_rate;
    }

    return undefined;
  };

  const rate = getRate();
  const inverseRate = getInverseRate();

  const getRecipientAmount = () => {
    const safeAmount = Number(amount || 0);

    if (isCrossCurrencySwap) {
      if (!crossCurrencyQuoteData) return "0.00";
      return Number(crossCurrencyQuoteData.destination_amount).toLocaleString(
        undefined,
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      );
    }

    if (
      (swapFromCurrency === ACCOUNT_CURRENCIES.USD.name &&
        swapToCurrency === ACCOUNT_CURRENCIES.SBC.name) ||
      (swapFromCurrency === ACCOUNT_CURRENCIES.SBC.name &&
        swapToCurrency === ACCOUNT_CURRENCIES.USD.name)
    ) {
      return formatAmount(safeAmount);
    }

    if (!exchangeRateData) return "0.00";

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

  const ensureFreshQuote = async (): Promise<boolean> => {
    if (!isCrossCurrencySwap) return true;

    const quoteAge = quoteFetchedAtRef.current
      ? Date.now() - quoteFetchedAtRef.current
      : Infinity;

    if (quoteAge <= CROSS_CURRENCY_QUOTE_MAX_AGE_MS) return true;

    const result = await refetchCrossCurrencyQuote();
    if (result.isError || !result.data) {
      toast.error("Exchange rate unavailable. Cannot proceed.");
      return false;
    }
    return true;
  };

  const canProceed = () => {
    if (isCrossCurrencySwap && (!amount || Number(amount) <= 0)) {
      toast.error("Enter an amount to get a quote.");
      return false;
    }
    if (!isUsdSbcSwap && (isRateError || !hasRateData)) {
      toast.error("Exchange rate unavailable. Cannot proceed.");
      return false;
    }
    return true;
  };

  const handleProceedToConfirmation = async () => {
    if (!canProceed()) return;
    const fresh = await ensureFreshQuote();
    if (!fresh) return;
    setStep("confirmation");
  };

  const handleProceedToPay = async () => {
    if (!canProceed()) return;
    const fresh = await ensureFreshQuote();
    if (!fresh) return;
    setStep("pay");
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
            goNext={handleProceedToConfirmation}
            exchangeRate={rate}
            inverseRate={inverseRate}
            recipientAmount={recipientAmount}
            timeLeft={timeLeft}
            loading={isRateLoading || cryptoFeeLoading}
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
              inverseRate={inverseRate}
              recipientAmount={recipientAmount}
              timeLeft={timeLeft}
              loading={isRateLoading}
              cryptoFee={cryptoFee}
            />
            <SwapConfirmation
              goBack={() => setStep("detail")}
              goNext={handleProceedToPay}
              exchangeRate={rate}
              inverseRate={inverseRate}
              recipientAmount={recipientAmount}
              timeLeft={timeLeft}
              loading={isRateLoading}
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
              inverseRate={inverseRate}
              recipientAmount={recipientAmount}
              timeLeft={timeLeft}
              loading={isRateLoading}
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
              inverseRate={inverseRate}
              recipientAmount={recipientAmount}
              timeLeft={timeLeft}
              loading={isRateLoading}
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
