"use client";
import { spendableBalances } from "@/lib/globalBalance";

import {
  FlowHeader,
  FlowCard,
  FlowRecipient,
  FlowAmount,
  FlowRow,
  FlowTotal,
  FlowActions,
} from "@/components/transactions/send-flow/Flow";
import { useUser } from "@/lib/hooks/useUser";
import { GetTransactionFeeApi } from "@/services/transactions";
import { ISwiftBeneficiary } from "@/types/services";
import { formatAmount, getApiErrorMessage } from "@/utils/helpers";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import SwiftInvoiceDropzone, {
  isSwiftInvoiceRequired,
} from "./SwiftInvoiceDropzone";

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
  const { user } = useUser();
  const [debouncedAmount, setDebouncedAmount] = useState(amount);
  const [invoiceError, setInvoiceError] = useState("");
  const numericAmount = Number(debouncedAmount);
  const canQuote = Number.isFinite(numericAmount) && numericAmount > 0;
  const invoiceRequired = isSwiftInvoiceRequired(
    beneficiary.beneficiary_type,
    Number(amount) || 0,
  );

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
  const invoiceValid = !invoiceRequired || !!invoiceFile;

  const canContinue =
    amountValid &&
    narrationValid &&
    invoiceValid &&
    !invoiceError &&
    amount === debouncedAmount &&
    canQuote &&
    !isFetching &&
    !isError &&
    typeof fee === "number" &&
    totalDebit <=
      Number(
        spendableBalances(user?.business_account).find(
          (balance) => balance.currency === "USD",
        )?.available_balance ?? 0,
      );

  return (
    <>
      <FlowHeader title="Send money" onBack={onBack} />
      <FlowCard>
        <FlowRecipient
          name={beneficiary.account_name}
          detail={`${beneficiary.bank_name} · ${beneficiary.country} · USD`}
          onChange={onBack}
        />
        <FlowAmount
          currency="USD"
          amount={amount}
          recipient={beneficiary.account_name}
          onChange={onAmountChange}
        />
        <FlowRow label="Rate">No conversion</FlowRow>
        <FlowRow label="You send">${formatAmount(Number(amount) || 0)}</FlowRow>
        <FlowRow label="SWIFT fee">
          {isFetching
            ? "Quoting…"
            : isError
              ? "Unavailable"
              : `$${formatAmount(quotedFee)}`}
        </FlowRow>
        <FlowTotal
          currency="USD"
          total={totalDebit}
          balance={Number(
            spendableBalances(user?.business_account).find(
              (balance) => balance.currency === "USD",
            )?.available_balance ?? 0,
          )}
        />
        {totalDebit >
          Number(
            spendableBalances(user?.business_account).find(
              (balance) => balance.currency === "USD",
            )?.available_balance ?? 0,
          ) && (
          <p role="alert" className="text-red-600 text-sm">
            Not enough USD for this transfer and its fee.
          </p>
        )}
        <label className="text-raiz-gray-500 text-xs mb-1.5 block">
          Narration
        </label>
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
            required={invoiceRequired}
            onChange={onInvoiceChange}
            onError={setInvoiceError}
          />
          {invoiceRequired && !invoiceFile && !invoiceError ? (
            <p className="text-raiz-gray-500 text-xs mt-2">
              An invoice is required when paying a business or sending more than
              $5,000.
            </p>
          ) : null}
        </div>

        {isError && (
          <p className="text-red-600 text-xs">
            {getApiErrorMessage(error, "Could not quote the SWIFT fee.")}
          </p>
        )}
        <FlowActions
          onNext={() => onConfirm(quotedFee)}
          disabled={!canContinue}
        />
      </FlowCard>
    </>
  );
};
export default SwiftAmountEntry;
