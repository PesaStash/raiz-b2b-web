"use client";

import {
  FlowHeader,
  FlowCard,
  FlowRow,
  FlowActions,
  FlowCurrency,
} from "@/components/transactions/send-flow/Flow";
import { ISwiftBeneficiary } from "@/types/services";
import { formatAmount, maskAccountNumber } from "@/utils/helpers";
import Image from "next/image";
import React from "react";

interface Props {
  beneficiary: ISwiftBeneficiary;
  amount: string;
  narration: string;
  invoiceFile: File | null;
  fee: number;
  error?: string;
  onConfirm: () => void;
  onBack: () => void;
}

const SwiftSummary = ({
  beneficiary,
  amount,
  narration,
  invoiceFile,
  fee,
  error,
  onConfirm,
  onBack,
}: Props) => {
  const numericAmount = Number(amount) || 0;
  const totalDebit = numericAmount + fee;
  const rows = [
    { label: "Beneficiary", value: beneficiary.label },
    { label: "Account name", value: beneficiary.account_name },
    { label: "Bank", value: beneficiary.bank_name },
    { label: "Country", value: beneficiary.country },
    {
      label: "Account",
      value: maskAccountNumber(beneficiary.account_number_or_iban),
    },
    { label: "SWIFT code", value: beneficiary.swift_code },
    { label: "Amount", value: `$${formatAmount(numericAmount)}` },
    { label: "SWIFT fee", value: `$${formatAmount(fee)}` },
    { label: "Total debit", value: `$${formatAmount(totalDebit)}` },
    { label: "Narration", value: narration },
    { label: "Invoice", value: invoiceFile?.name || "None" },
  ];

  return (
    <>
      <FlowHeader title="Review SWIFT request" onBack={onBack} />
      <FlowCard>
        <div className="flex items-center gap-2.5">
          <FlowCurrency currency="USD" size={36} />
          <Image
            src="/images/send/chevron.svg"
            width={18}
            height={18}
            alt="to"
            className="rotate-180"
          />
          <Image src="/images/send/swift.svg" width={44} height={44} alt="" />
        </div>
        <p className="text-4xl font-semibold">${formatAmount(totalDebit)}</p>
        <p className="text-sm text-[#79708d]">
          Total USD deducted from your balance
        </p>
        {rows.map((row) => (
          <FlowRow key={row.label} label={row.label}>
            {row.value}
          </FlowRow>
        ))}
        <div className="p-4 rounded-xl bg-[#f3f1fd] text-[13px]">
          <strong>Reviewed by Raiz before sending</strong>
          <p className="text-xs text-[#79708d] mt-1.5">
            This request stays pending until our team processes it.
          </p>
        </div>
        {error && (
          <p className="text-red-600 text-sm" role="alert">
            {error}
          </p>
        )}
        <FlowActions
          onBack={onBack}
          onNext={onConfirm}
          nextLabel="Submit request"
        />
      </FlowCard>
    </>
  );
};
export default SwiftSummary;
