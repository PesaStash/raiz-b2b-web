"use client";
import React, { useEffect, useState } from "react";
import {
  IAlipayWechatAmountQuoteResponse,
  IAlipayWechatBeneficiary,
  IAlipayWechatSendResponse,
} from "@/types/services";
import { PaymentStatusType } from "@/types/transactions";
import PaymentStatusModal from "@/components/modals/PaymentStatusModal";
import { AlipayWechatSendApi } from "@/services/transactions";
import {
  getTransactionId,
  getTransactionStatus,
  trackMoneyMovementSuccess,
  trackTransactionFailed,
} from "@/utils/analytics/dataLayer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ChannelSelect from "./ChannelSelect";
import AmountEntry from "./AmountEntry";
import BeneficiarySelect from "./BeneficiarySelect";
import AlipayWechatSummary from "./AlipayWechatSummary";
import AlipayWechatPay from "./AlipayWechatPay";
import AlipayWechatStatus from "./AlipayWechatStatus";

type AlipayWechatStep =
  | "channel"
  | "beneficiary"
  | "amount"
  | "summary"
  | "pay"
  | "status";

interface Props {
  close: () => void;
  onPastChannelChange?: (pastChannel: boolean) => void;
}

const AlipayWechatSend = ({ close, onPastChannelChange }: Props) => {
  const [step, setStep] = useState<AlipayWechatStep>("channel");
  const [channel, setChannel] = useState<"alipay" | "wechat" | null>(null);
  const [rate, setRate] = useState("");
  const [destinationAmount, setDestinationAmount] = useState("");
  const [quote, setQuote] = useState<IAlipayWechatAmountQuoteResponse | null>(
    null,
  );
  const [selectedBeneficiary, setSelectedBeneficiary] =
    useState<IAlipayWechatBeneficiary | null>(null);
  const [transactionResult, setTransactionResult] =
    useState<IAlipayWechatSendResponse | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const [status, setStatus] = useState<PaymentStatusType>(null);
  const qc = useQueryClient();

  useEffect(() => {
    onPastChannelChange?.(step !== "channel");
  }, [step, onPastChannelChange]);

  const reset = () => {
    setStep("channel");
    setChannel(null);
    setRate("");
    setDestinationAmount("");
    setQuote(null);
    setSelectedBeneficiary(null);
    setTransactionResult(null);
    setPaymentError("");
    setStatus(null);
  };

  const handleDone = () => {
    reset();
    close();
  };

  const handleChannelSelected = (
    ch: "alipay" | "wechat",
    fetchedRate: string,
  ) => {
    setChannel(ch);
    setRate(fetchedRate);
    setStep("beneficiary");
  };

  const handleBeneficiarySelected = (b: IAlipayWechatBeneficiary) => {
    setSelectedBeneficiary(b);
    setStep("amount");
  };

  const handleAmountConfirmed = (
    amount: string,
    fetchedQuote: IAlipayWechatAmountQuoteResponse,
  ) => {
    setDestinationAmount(amount);
    setQuote(fetchedQuote);
    setStep("summary");
  };

  const sendMutation = useMutation({
    mutationFn: async (transactionPin: string) => {
      if (!channel || !selectedBeneficiary) {
        throw new Error("Missing Alipay/WeChat payment details");
      }
      return AlipayWechatSendApi({
        beneficiary_id: selectedBeneficiary.alipay_wechat_beneficiary_id,
        channel,
        amount: destinationAmount,
        transaction_pin: transactionPin,
      });
    },
    onMutate: () => {
      setPaymentError("");
      setStatus("loading");
      setStep("status");
    },
    onSuccess: (result: IAlipayWechatSendResponse) => {
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["transactions-report"] });
      qc.invalidateQueries({ queryKey: ["alipay-wechat-beneficiaries"] });

      if (getTransactionStatus(result) === "completed") {
        const transactionId = getTransactionId(result);
        if (transactionId) {
          trackMoneyMovementSuccess({
            event: "send_completed",
            transactionId,
            value: Number(destinationAmount) || 0,
            currency: "NGN",
            extra: { recipient_type: "external" },
          });
        }
      }

      setTransactionResult(result);
      setStatus(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Transaction failed. Please try again.";
      trackTransactionFailed({
        transactionType: "send",
        error: (err as { response?: unknown })?.response ?? err,
        value: Number(destinationAmount) || undefined,
        currency: "NGN",
      });
      setPaymentError(msg);
      setStatus("failed");
    },
  });

  switch (step) {
    case "channel":
      return <ChannelSelect onSelect={handleChannelSelected} />;

    case "beneficiary":
      return (
        channel && (
          <BeneficiarySelect
            channel={channel}
            onSelect={handleBeneficiarySelected}
            onBack={() => setStep("channel")}
          />
        )
      );

    case "amount":
      return (
        channel && (
          <AmountEntry
            channel={channel}
            rate={rate}
            onConfirm={handleAmountConfirmed}
            onBack={() => setStep("beneficiary")}
          />
        )
      );

    case "summary":
      return (
        channel &&
        selectedBeneficiary &&
        quote && (
          <AlipayWechatSummary
            channel={channel}
            beneficiary={selectedBeneficiary}
            destinationAmount={destinationAmount}
            quote={quote}
            onConfirm={() => setStep("pay")}
            onBack={() => setStep("amount")}
          />
        )
      );

    case "pay":
      return (
        channel &&
        selectedBeneficiary &&
        quote && (
          <>
            <AlipayWechatSummary
              channel={channel}
              beneficiary={selectedBeneficiary}
              destinationAmount={destinationAmount}
              quote={quote}
              onConfirm={() => setStep("pay")}
              onBack={() => setStep("amount")}
            />
            <AlipayWechatPay
              submitting={sendMutation.isPending}
              onSubmit={(pin) => sendMutation.mutate(pin)}
              onClose={() => setStep("summary")}
            />
          </>
        )
      );

    case "status":
      if (status === null && transactionResult) {
        return (
          <AlipayWechatStatus
            result={transactionResult}
            error={paymentError}
            onDone={handleDone}
          />
        );
      }

      return (
        channel &&
        selectedBeneficiary &&
        quote && (
          <>
            <AlipayWechatSummary
              channel={channel}
              beneficiary={selectedBeneficiary}
              destinationAmount={destinationAmount}
              quote={quote}
              onConfirm={() => setStep("pay")}
              onBack={() => setStep("amount")}
            />
            {(status === "loading" || status === "failed") && (
              <PaymentStatusModal
                status={status}
                amount={parseFloat(destinationAmount) || 0}
                currency="CNY"
                user={selectedBeneficiary}
                close={handleDone}
                error={paymentError}
                tryAgain={() => {
                  setStatus(null);
                  setStep("summary");
                }}
                viewReceipt={handleDone}
                type="external"
              />
            )}
          </>
        )
      );

    default:
      return null;
  }
};

export default AlipayWechatSend;
