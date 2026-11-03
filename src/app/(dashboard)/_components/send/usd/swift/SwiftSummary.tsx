"use client";

import Button from "@/components/ui/Button";
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
    <div className="p-0 md:p-6 h-full flex flex-col overflow-y-auto no-scrollbar">
      <button type="button" onClick={onBack} className="mb-6 self-start">
        <Image src="/icons/arrow-left.svg" width={18} height={18} alt="back" />
      </button>
      <h3 className="text-raiz-gray-950 text-base font-bold mb-2">
        Review SWIFT payout
      </h3>
      <p className="text-raiz-gray-500 text-xs mb-6">
        This request stays pending until our team processes it. Delivery is not
        instant.
      </p>

      <div className="rounded-2xl border border-raiz-gray-100 bg-white overflow-y-auto no-scrollbar mb-4">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={`flex items-start justify-between gap-4 px-4 py-3 ${
              index !== rows.length - 1 ? "border-b border-raiz-gray-100" : ""
            }`}
          >
            <span className="text-raiz-gray-500 text-sm">{row.label}</span>
            <span className="text-raiz-gray-950 text-sm text-right">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
          <p className="text-red-600 text-xs">{error}</p>
        </div>
      )}

      <Button onClick={onConfirm}>Continue to PIN</Button>
    </div>
  );
};

export default SwiftSummary;
