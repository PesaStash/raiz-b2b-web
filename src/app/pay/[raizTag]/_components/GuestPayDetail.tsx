"use client";
import React, { useEffect, useRef, useState } from "react";
import GuestPayAmount from "./GuestPayAmount";
import GuestTransferSummary from "./GuestTransferSummary";
import GuestSendStatusModal from "./GuestSendStatusModal";
import { useGuestSendStore } from "@/store/GuestSend";
import { IBusinessPaymentData } from "@/types/services";
import { useQuery } from "@tanstack/react-query";
import { GetAfricaPayinStatus } from "@/services/business";
import { GuestPayDetailsSteps, GuestPaymentType } from "../PayUserClient";

interface Props {
  close: () => void;
  data: IBusinessPaymentData;
  step: GuestPayDetailsSteps;
  setStep: (v: GuestPayDetailsSteps) => void;
  goBack: () => void;
  setGuestPayType: (v: GuestPaymentType | undefined) => void;
}

const GuestPayDetail = ({
  close,
  data,
  step,
  setStep,
  goBack,
  setGuestPayType,
}: Props) => {
  const [paymentError, setPaymentError] = useState("");
  const { amount, payout_currency, status, actions, payin_id } =
    useGuestSendStore();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const handleDone = () => {
    actions.reset();
    setGuestPayType(undefined);
    close();
    setStep("details");
  };

  const {
    data: payinStatus,
    error: payinError,
    refetch: fetchPayinStatus,
  } = useQuery({
    queryKey: ["african-payin-status", payin_id],
    queryFn: () => GetAfricaPayinStatus(payin_id),
    enabled: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (payinStatus) {
      actions.setField("status", payinStatus);

      if (payinStatus === "failed") {
        setPaymentError("Payment failed. Please try again.");
      } else {
        setPaymentError("");
      }

      //  Stop polling only when status is "complete" or "failed"
      if (payinStatus === "complete" || payinStatus === "failed") {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    }
  }, [payinStatus, actions]);

  useEffect(() => {
    if (payinError) {
      if (
        typeof payinError === "object" &&
        payinError !== null &&
        "message" in payinError
      ) {
        setPaymentError(
          (payinError as { message?: string }).message ||
            "Failed to fetch payment status"
        );
      } else {
        setPaymentError("Failed to fetch payment status");
      }
    }
  }, [payinError]);

  const confirmPayment = async () => {
    const result = await fetchPayinStatus();
    if (result?.data) {
      setStep("status");
      pollingRef.current = setInterval(() => {
        fetchPayinStatus();
      }, 8000);
    }
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const displayStep = () => {
    switch (step) {
      case "details":
        return (
          <GuestPayAmount close={goBack} goNext={() => setStep("summary")} />
        );
      case "summary":
        return (
          <GuestTransferSummary
            goBack={() => setStep("details")}
            goNext={confirmPayment}
          />
        );
      case "status":
        return (
          <GuestSendStatusModal
            status={status}
            amount={amount}
            currency={payout_currency}
            close={handleDone}
            error={paymentError}
            tryAgain={() => setStep("summary")}
            viewReceipt={() => setStep("receipt")}
            merchantName={data?.wallets?.[0]?.wallet_name || ""}
          />
        );
      default:
        return null;
    }
  };

  return <>{displayStep()}</>;
};

export default GuestPayDetail;
