"use client";

import React, { useState } from "react";
import { ISwiftBeneficiary, ISwiftSendResponse } from "@/types/services";
import { PaymentStatusType } from "@/types/transactions";
import PaymentStatusModal from "@/components/modals/PaymentStatusModal";
import { SwiftSendApi } from "@/services/transactions";
import {
  getTransactionId,
  trackMoneyMovementSuccess,
  trackTransactionFailed,
} from "@/utils/analytics/dataLayer";
import { mapSwiftError } from "@/utils/swiftErrors";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import SwiftBeneficiarySelect from "./SwiftBeneficiarySelect";
import SwiftAmountEntry from "./SwiftAmountEntry";
import SwiftSummary from "./SwiftSummary";
import SwiftPay from "./SwiftPay";

type SwiftStep = "beneficiary" | "amount" | "summary" | "pay" | "status";

interface Props {
  close: () => void;
}

const SwiftSend = ({ close }: Props) => {
  const [step, setStep] = useState<SwiftStep>("beneficiary");
  const [beneficiary, setSelectedBeneficiary] =
    useState<ISwiftBeneficiary | null>(null);
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [fee, setFee] = useState(0);
  const [paymentError, setPaymentError] = useState("");
  const [status, setStatus] = useState<PaymentStatusType>(null);
  const qc = useQueryClient();

  const reset = () => {
    setStep("beneficiary");
    setSelectedBeneficiary(null);
    setAmount("");
    setNarration("");
    setInvoiceFile(null);
    setFee(0);
    setPaymentError("");
    setStatus(null);
  };

  const handleDone = () => {
    reset();
    close();
  };

  const sendMutation = useMutation({
    mutationFn: async (transactionPin: string) => {
      if (!beneficiary) {
        throw new Error("Missing SWIFT beneficiary");
      }
      const form = new FormData();
      form.append("beneficiary_id", beneficiary.swift_beneficiary_id);
      form.append("amount", amount);
      form.append("narration", narration.trim());
      form.append("transaction_pin", transactionPin);
      if (invoiceFile) form.append("invoice_file", invoiceFile);
      return SwiftSendApi(form);
    },
    onMutate: () => {
      setPaymentError("");
      setStatus("loading");
      setStep("status");
    },
    onSuccess: (result: ISwiftSendResponse) => {
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["transactions-report"] });
      qc.invalidateQueries({ queryKey: ["income-expense-chart"] });
      qc.invalidateQueries({ queryKey: ["transaction-report-categories"] });
      qc.invalidateQueries({ queryKey: ["today-outflow"] });
      qc.invalidateQueries({ queryKey: ["swift-beneficiaries"] });

      if (result.status === "completed") {
        const transactionId =
          getTransactionId(result) || result.swift_transaction_request_id;
        if (transactionId) {
          trackMoneyMovementSuccess({
            event: "send_completed",
            transactionId,
            value: Number(amount) || 0,
            currency: "USD",
            extra: { recipient_type: "external" },
          });
        }
        setStatus("success");
        return;
      }
      setStatus("pending");
    },
    onError: (error) => {
      const mapped = mapSwiftError(
        error,
        "Unable to submit this SWIFT request. Please try again.",
      );
      trackTransactionFailed({
        transactionType: "send",
        error,
        value: Number(amount) || undefined,
        currency: "USD",
      });
      setPaymentError(mapped.message);
      setStatus("failed");
    },
  });

  switch (step) {
    case "beneficiary":
      return (
        <SwiftBeneficiarySelect
          onSelect={(next) => {
            setSelectedBeneficiary(next);
            setStep("amount");
          }}
          onBack={close}
          invoiceFile={invoiceFile}
          onInvoiceChange={setInvoiceFile}
        />
      );
    case "amount":
      return (
        beneficiary && (
          <SwiftAmountEntry
            beneficiary={beneficiary}
            amount={amount}
            narration={narration}
            invoiceFile={invoiceFile}
            onAmountChange={setAmount}
            onNarrationChange={setNarration}
            onInvoiceChange={setInvoiceFile}
            onConfirm={(quotedFee) => {
              setFee(quotedFee);
              setPaymentError("");
              setStep("summary");
            }}
            onBack={() => setStep("beneficiary")}
          />
        )
      );
    case "summary":
      return (
        beneficiary && (
          <SwiftSummary
            beneficiary={beneficiary}
            amount={amount}
            narration={narration}
            invoiceFile={invoiceFile}
            fee={fee}
            error={paymentError}
            onConfirm={() => setStep("pay")}
            onBack={() => setStep("amount")}
          />
        )
      );
    case "pay":
      return (
        beneficiary && (
          <>
            <SwiftSummary
              beneficiary={beneficiary}
              amount={amount}
              narration={narration}
              invoiceFile={invoiceFile}
              fee={fee}
              onConfirm={() => setStep("pay")}
              onBack={() => setStep("amount")}
            />
            <SwiftPay
              submitting={sendMutation.isPending}
              onSubmit={(pin) => sendMutation.mutate(pin)}
              onClose={() => setStep("summary")}
            />
          </>
        )
      );
    case "status":
      return (
        beneficiary && (
          <>
            <SwiftSummary
              beneficiary={beneficiary}
              amount={amount}
              narration={narration}
              invoiceFile={invoiceFile}
              fee={fee}
              onConfirm={() => setStep("pay")}
              onBack={() => setStep("amount")}
            />
            <PaymentStatusModal
              status={status}
              amount={Number(amount) || 0}
              currency="USD"
              user={beneficiary}
              close={handleDone}
              error={paymentError}
              tryAgain={() => {
                setStatus(null);
                setStep("summary");
              }}
              viewReceipt={handleDone}
              type="external"
            />
          </>
        )
      );
    default:
      return null;
  }
};

export default SwiftSend;
