"use client";
import { useCryptoSwapStore } from "@/store/CryptoSwap";
import React, { useState } from "react";
import SwapCoinType from "./SwapCoinType";
import CryptoSwapDetail from "./CryptoSwapDetail";
import CryptoSwapConfirmation from "./CryptoSwapConfirmation";
import CryptoSwapPay from "./CryptoSwapPay";
import { useQuery } from "@tanstack/react-query";
import { GetIntTransactionFeeApi } from "@/services/transactions";
import CryptoSwapStatusModal from "./CryptoSwapStatusModal";

export type CryptoSwapStep =
  | "coin-type"
  | "detail"
  | "confirmation"
  | "pay"
  | "status"
  | "receipt";

interface Props {
  close: () => void;
}

const CryptoSwap = ({ close }: Props) => {
  const [step, setStep] = useState<CryptoSwapStep>("coin-type");
  const { status, actions, amount } = useCryptoSwapStore();
  const [paymentError, setPaymentError] = useState("");

  const handleDone = () => {
    actions.reset();
    close();
  };

  const { data: fee, isLoading } = useQuery({
    queryKey: ["transactions-fee", amount],
    queryFn: () => GetIntTransactionFeeApi(Number(amount), "CRYPTO_SWAP"),
    enabled: !!amount,
  });

  const displayScreen = () => {
    switch (step) {
      case "coin-type":
        return (
          <SwapCoinType close={handleDone} goNext={() => setStep("detail")} />
        );
      case "detail":
        return (
          <CryptoSwapDetail
            close={handleDone}
            goNext={() => {
              setStep("confirmation");
            }}
            fee={fee || 0}
            loading={isLoading}
          />
        );
      case "confirmation":
        return (
          <>
            <CryptoSwapDetail
              close={handleDone}
              goNext={() => {
                setStep("confirmation");
              }}
              fee={fee || 0}
              loading={isLoading}
            />
            <CryptoSwapConfirmation
              goBack={() => setStep("detail")}
              goNext={() => setStep("pay")}
              fee={fee || 0}
            />
          </>
        );
      case "pay":
        return (
          <>
            <CryptoSwapDetail
              close={handleDone}
              goNext={() => {
                setStep("confirmation");
              }}
              fee={fee || 0}
              loading={isLoading}
            />
            <CryptoSwapPay
              goNext={() => setStep("status")}
              close={() => setStep("confirmation")}
              setPaymentError={setPaymentError}
            />
          </>
        );
      case "status":
        return (
          <>
            <CryptoSwapDetail
              close={handleDone}
              goNext={() => {
                setStep("confirmation");
              }}
              fee={fee || 0}
              loading={isLoading}
            />
            <CryptoSwapStatusModal
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

export default CryptoSwap;
