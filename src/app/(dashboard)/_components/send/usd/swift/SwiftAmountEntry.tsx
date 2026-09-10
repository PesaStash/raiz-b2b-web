"use client";

import Button from "@/components/ui/Button";
import { GetTransactionFeeApi } from "@/services/transactions";
import { ISwiftBeneficiary } from "@/types/services";
import { formatAmount, getApiErrorMessage } from "@/utils/helpers";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import SwiftInvoiceDropzone from "./SwiftInvoiceDropzone";

interface Props {
  beneficiary: ISwiftBeneficiary;
  amount: string;
  narration: string;
  invoiceFile: File | null;
  onAmountChange: (amount: string) => void;
  onNarrationChange: (narration: string) => void;
  onInvoiceChange: (file: File | null) => void;
  onConfirm: (fee: number) => void;
  onBack: () => void;
}

const SwiftAmountEntry = ({
  beneficiary,
  amount,
  narration,
  invoiceFile,
  onAmountChange,
  onNarrationChange,
  onInvoiceChange,
  onConfirm,
  onBack,
}: Props) => {
  const [debouncedAmount, setDebouncedAmount] = useState(amount);
  const [invoiceError, setInvoiceError] = useState("");
  const numericAmount = Number(debouncedAmount);
  const canQuote = Number.isFinite(numericAmount) && numericAmount > 0;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAmount(amount), 400);
    return () => clearTimeout(timer);
  }, [amount]);

  const {
    data: fee,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["transactions-fee", debouncedAmount, "USD", "swift"],
    queryFn: () =>
      GetTransactionFeeApi(numericAmount, "USD", undefined, "swift"),
    enabled: canQuote,
  });

  const quotedFee = canQuote && typeof fee === "number" ? fee : 0;
  const totalDebit = canQuote ? numericAmount + quotedFee : 0;
  const narrationValid =
    narration.trim().length >= 2 && narration.trim().length <= 500;
  const amountValid = /^\d+(\.\d{1,2})?$/.test(amount) && numericAmount > 0;

  const canContinue =
    amountValid &&
    narrationValid &&
    !invoiceError &&
    amount === debouncedAmount &&
    canQuote &&
    !isFetching &&
    !isError &&
    typeof fee === "number";

  return (
    <div className="p-0 md:p-6 h-full flex flex-col overflow-y-auto no-scrollbar">
      <button type="button" onClick={onBack} className="mb-6 self-start">
        <Image src="/icons/arrow-left.svg" width={18} height={18} alt="back" />
      </button>
      <h3 className="text-raiz-gray-950 text-base font-bold mb-1">
        SWIFT payout details
      </h3>
      <p className="text-raiz-gray-500 text-xs mb-6">
        Sending to {beneficiary.label}. This request is processed manually and
        is not instant.
      </p>

      <label className="text-raiz-gray-500 text-xs mb-1.5 block">USD amount</label>
      <input
        value={amount}
        onChange={(event) => onAmountChange(event.target.value)}
        inputMode="decimal"
        placeholder="0.00"
        className="w-full border border-raiz-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-raiz-purple-500 mb-4"
      />

      <label className="text-raiz-gray-500 text-xs mb-1.5 block">Narration</label>
      <textarea
        value={narration}
        onChange={(event) => onNarrationChange(event.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Payment purpose"
        className="w-full border border-raiz-gray-200 min-h-[100px] rounded-2xl px-4 py-3 text-sm outline-none focus:border-raiz-purple-500 mb-1"
      />
      {narration.length > 0 && !narrationValid && (
        <p className="text-red-600 text-xs mb-3">
          Narration must be 2 to 500 characters.
        </p>
      )}

      <div className="mt-4 mb-4">
        <SwiftInvoiceDropzone
          file={invoiceFile}
          error={invoiceError}
          onChange={onInvoiceChange}
          onError={setInvoiceError}
        />
      </div>

      <div className="rounded-2xl bg-raiz-gray-50 p-4 mt-2 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-raiz-gray-500">SWIFT fee</span>
          <span>
            {isFetching
              ? "Quoting..."
              : isError
                ? "Unavailable"
                : `$${formatAmount(quotedFee)}`}
          </span>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span>Total debit</span>
          <span>${formatAmount(totalDebit)}</span>
        </div>
        {isError && (
          <p className="text-red-600 text-xs mt-2">
            {getApiErrorMessage(error, "Could not quote the SWIFT fee.")}
          </p>
        )}
      </div>

      <Button disabled={!canContinue} onClick={() => onConfirm(quotedFee)}>
        Continue
      </Button>
    </div>
  );
};

export default SwiftAmountEntry;
