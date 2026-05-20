"use client";
import React, { useState } from "react";
import {
  IAlipayWechatAmountQuoteResponse,
  IAlipayWechatBeneficiary,
  IAlipayWechatSendResponse,
} from "@/types/services";
import ChannelSelect from "./ChannelSelect";
import AmountEntry from "./AmountEntry";
import BeneficiarySelect from "./BeneficiarySelect";
import AlipayWechatSummary from "./AlipayWechatSummary";
import AlipayWechatPay from "./AlipayWechatPay";
import AlipayWechatStatus from "./AlipayWechatStatus";

type AlipayWechatStep =
  | "channel"
  | "amount"
  | "beneficiary"
  | "summary"
  | "pay"
  | "status";

interface Props {
  close: () => void;
}

const AlipayWechatSend = ({ close }: Props) => {
  const [step, setStep] = useState<AlipayWechatStep>("channel");
  const [channel, setChannel] = useState<"alipay" | "wechat" | null>(null);
  const [rate, setRate] = useState<string>("");
  const [destinationAmount, setDestinationAmount] = useState<string>("");
  const [quote, setQuote] = useState<IAlipayWechatAmountQuoteResponse | null>(
    null
  );
  const [selectedBeneficiary, setSelectedBeneficiary] =
    useState<IAlipayWechatBeneficiary | null>(null);
  const [transactionResult, setTransactionResult] =
    useState<IAlipayWechatSendResponse | null>(null);
  const [paymentError, setPaymentError] = useState<string>("");

  const handleChannelSelected = (
    ch: "alipay" | "wechat",
    fetchedRate: string
  ) => {
    setChannel(ch);
    setRate(fetchedRate);
    setStep("amount");
  };

  const handleAmountConfirmed = (
    amount: string,
    fetchedQuote: IAlipayWechatAmountQuoteResponse
  ) => {
    setDestinationAmount(amount);
    setQuote(fetchedQuote);
    setStep("beneficiary");
  };

  const handleBeneficiarySelected = (b: IAlipayWechatBeneficiary) => {
    setSelectedBeneficiary(b);
    setStep("summary");
  };

  const handleSendSuccess = (result: IAlipayWechatSendResponse) => {
    setTransactionResult(result);
    setStep("status");
  };

  const handleSendError = (msg: string) => {
    setPaymentError(msg);
  };

  const reset = () => {
    setStep("channel");
    setChannel(null);
    setRate("");
    setDestinationAmount("");
    setQuote(null);
    setSelectedBeneficiary(null);
    setTransactionResult(null);
    setPaymentError("");
  };

  switch (step) {
    case "channel":
      return <ChannelSelect onSelect={handleChannelSelected} />;

    case "amount":
      return (
        channel && (
          <AmountEntry
            channel={channel}
            rate={rate}
            onConfirm={handleAmountConfirmed}
            onBack={() => setStep("channel")}
          />
        )
      );

    case "beneficiary":
      return (
        channel && (
          <BeneficiarySelect
            channel={channel}
            onSelect={handleBeneficiarySelected}
            onBack={() => setStep("amount")}
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
            onBack={() => setStep("beneficiary")}
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
              onBack={() => setStep("beneficiary")}
            />
            <AlipayWechatPay
              channel={channel}
              beneficiaryId={selectedBeneficiary.alipay_wechat_beneficiary_id}
              amount={destinationAmount}
              onSuccess={handleSendSuccess}
              onError={handleSendError}
              onClose={() => setStep("summary")}
            />
          </>
        )
      );

    case "status":
      return (
        transactionResult && (
          <AlipayWechatStatus
            result={transactionResult}
            error={paymentError}
            onDone={() => {
              reset();
              close();
            }}
          />
        )
      );

    default:
      return null;
  }
};

export default AlipayWechatSend;
