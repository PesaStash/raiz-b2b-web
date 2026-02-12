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
import { formatAmount } from "@/utils/helpers";
// import RaizReceipt from "@/components/transactions/RaizReceipt";

export type SwapStep = "detail" | "confirmation" | "pay" | "status" | "receipt";

interface Props {
  close: () => void;
}

const Swap = ({ close }: Props) => {
  const [step, setStep] = useState<SwapStep>("detail");
  const [timeLeft, setTimeLeft] = useState<number>(119);
  const { amount, swapToCurrency, status, actions, swapFromCurrency } =
    useSwapStore();
  const [paymentError, setPaymentError] = useState("");

  const {
    data: exchangeRateData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["exchange-rate", "NGN"],
    queryFn: () => GetExchangeRate("NGN"),
    staleTime: 1000 * 60, // 1 minute
  });

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
    if (swapToCurrency === ACCOUNT_CURRENCIES.NGN.name) {
      return exchangeRateData?.sell_rate || 0;
    }

    if (swapToCurrency === ACCOUNT_CURRENCIES.USD.name) {
      if (swapFromCurrency === ACCOUNT_CURRENCIES.SBC.name) {
        return 1;
      }
      return exchangeRateData?.buy_rate || 0;
    }
  };

  const rate = getRate();

  const getRecipientAmount = () => {
    if (!exchangeRateData) return "0.00";

    const safeAmount = Number(amount || 0);

    if (swapToCurrency === ACCOUNT_CURRENCIES.NGN.name) {
      return (
        Number(safeAmount * Number(exchangeRateData.buy_rate)).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        ) || "1.00"
      );
    }
    if (swapToCurrency === ACCOUNT_CURRENCIES.USD.name) {
      if (swapFromCurrency === ACCOUNT_CURRENCIES.SBC.name) {
        return formatAmount(safeAmount * 1);
      }
      return (
        Number(safeAmount / Number(exchangeRateData.sell_rate)).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        ) || "1.00"
      );
    }
    return formatAmount(safeAmount);
  };

  const recipientAmount = getRecipientAmount();

  const handleDone = () => {
    actions.reset();
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
              setStep("confirmation");
            }}
            exchangeRate={rate}
            recipientAmount={recipientAmount}
            timeLeft={timeLeft}
            loading={isLoading || isFetching}
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
              goNext={() => setStep("pay")}
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
          <SwapPayment
            goNext={() => setStep("status")}
            close={() => setStep("confirmation")}
            setPaymentError={setPaymentError}
          />
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
