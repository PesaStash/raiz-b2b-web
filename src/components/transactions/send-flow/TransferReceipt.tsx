"use client";
import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import type { ITransaction } from "@/types/transactions";
import { formatAmount, getCurrencySymbol } from "@/utils/helpers";
import { FlowHeader, FlowCard, FlowRow, FlowActions } from "./Flow";

export default function TransferReceipt({
  data,
  close,
  businessName,
}: {
  data: ITransaction;
  close: () => void;
  businessName?: string;
}) {
  const [copied, setCopied] = useState(false);
  const money = (amount: number, currency: string) =>
    `${getCurrencySymbol(currency)}${formatAmount(amount)}`;
  const destination = data.settlement?.destination_money;
  const received = money(
    destination ? Number(destination.amount) : data.transaction_amount,
    destination?.currency || data.currency,
  );
  const status = data.transaction_status?.transaction_status || "pending";
  const rows = [
    ["Recipient", data.third_party_name],
    [
      "Method",
      [data.beneficiary_bank_name, data.beneficiary_account_number]
        .filter(Boolean)
        .join(" · "),
    ],
    [
      status === "completed" ? "Recipient received" : "Transfer amount",
      received,
    ],
    [
      "Fee",
      money(
        data.fee_amount || 0,
        data.account_balance_currency || data.currency,
      ),
    ],
    ["Status", status],
    ["Reference", data.transaction_reference],
    ["Date", new Date(data.transaction_date_time).toLocaleString()],
    ["Purpose", data.transaction_remarks],
  ].filter(([, value]) => value);
  const impact = data.settlement?.wallet_impact;
  if (impact)
    rows.splice(
      3,
      0,
      [
        "Paid from balance",
        money(Number(impact.gross.amount), impact.gross.currency),
      ],
      ["Total deducted", money(Number(impact.net.amount), impact.net.currency)],
    );
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        rows.map(([label, value]) => `${label}: ${value}`).join("\n"),
      );
      setCopied(true);
    } catch {
      toast.error("Couldn’t copy receipt details. Please try again.");
    }
  };
  return (
    <>
      <FlowHeader
        title="Transfer receipt"
        subtitle={businessName}
        onBack={close}
      />
      <FlowCard>
        <div className="flex items-center gap-3.5 pb-2">
          <div className="size-14 shrink-0 rounded-full bg-[#EAECFF99] flex items-center justify-center">
            <Image
              src={`/images/send/${status === "completed" ? "success" : status === "failed" ? "failed" : "pending"}.svg`}
              width={48}
              height={48}
              alt=""
            />
          </div>
          <div className="flex-1">
            <p className="text-[28px] font-semibold">{received}</p>
            <p className="text-[13px] text-[#79708d]">
              {status === "completed"
                ? "Recipient received"
                : "Transfer amount"}
            </p>
          </div>
          <span className="capitalize text-xs bg-[#f3f1fd] text-primary2 rounded-full px-2.5 py-1">
            {status}
          </span>
        </div>
        {rows.map(([label, value]) => (
          <FlowRow key={label} label={label}>
            {value}
          </FlowRow>
        ))}
        <div className="p-4 rounded-xl bg-[#f3f1fd] text-sm">
          <strong>Keep this receipt</strong>
          <p className="text-xs text-[#79708d] mt-1.5">
            Use these details if you need help with this transfer.
          </p>
        </div>
        <FlowActions
          onBack={close}
          backLabel="Done"
          onNext={copy}
          nextLabel={copied ? "Copied" : "Copy receipt details"}
        />
      </FlowCard>
    </>
  );
}
