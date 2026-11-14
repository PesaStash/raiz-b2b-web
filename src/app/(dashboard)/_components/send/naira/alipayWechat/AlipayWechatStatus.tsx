"use client";
import Image from "next/image";
import { toast } from "sonner";
import {
  IAlipayWechatBeneficiary,
} from "@/types/services";
import {
  FlowCard,
  FlowCurrency,
  FlowRow,
  FlowActions,
} from "@/components/transactions/send-flow/Flow";
import type { ChinaPayQuote, ChinaPayResult } from "@/types/chinaPay";
import { formatMoney } from "@/lib/globalBalance";
interface Props {
  result: ChinaPayResult;
  quote?: ChinaPayQuote;
  beneficiary?: IAlipayWechatBeneficiary;
  error: string;
  onDone: () => void;
}
export default function AlipayWechatStatus({
  result,
  quote,
  beneficiary,
  error,
  onDone,
}: Props) {
  const currency = result.funding_currency;
  const confirmedQuote = quote?.quote_id === result.quote_id ? quote : undefined;
  const total = confirmedQuote?.total_debit.amount;
  const completed = result.status === "completed";
  const failed = result.status === "failed";
  const label = result.channel === "alipay" ? "Alipay" : "WeChat Pay";
  const amount = formatMoney(result.destination_amount,result.destination_currency || "CNY");
  const title = result.status === "reversed" ? "Payment reversed" : completed
    ? `${amount} sent${beneficiary ? ` to ${beneficiary.name}` : ""}`
    : failed
      ? "Payment didn’t go through"
      : "Your payment is processing";
  const copyReceipt = async () => {
    try {
      await navigator.clipboard.writeText(
        [
          title,
          `Payment type: ${label}`,
          `Recipient: ${beneficiary?.name || result.beneficiary_id}`,
          `Recipient gets: ${amount}`,
          `Funding amount: ${formatMoney(result.funding_amount, currency)}`,
          `Status: ${result.status}`,
          `Reference: ${result.alipay_wechat_transaction_request_id}`,
        ].join("\n"),
      );
      toast.success("Payment details copied");
    } catch {
      toast.error("Could not copy payment details. Please try again.");
    }
  };
  return (
    <FlowCard className="!gap-5 !pt-9">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-24 items-center justify-center rounded-full bg-[#EAECFF99]">
          <Image
            src={`/images/send/${completed ? "success" : failed ? "failed" : "pending"}.svg`}
            width={completed || failed ? 48 : 46}
            height={completed || failed ? 48 : 46}
            alt=""
          />
        </span>
        <h1 className="text-[28px] font-semibold">{title}</h1>
        <p className="text-sm text-[#79708d]">
          {result.status === "reversed" ? `Funds were reversed into the original ${currency} balance.` : completed
            ? `Delivered to their ${label} wallet`
            : failed
              ? error || "Check the payment details before trying again."
              : "Your request has been submitted for processing."}
        </p>
        <span className="flex items-center gap-2 rounded-full bg-[#f4f4f8] px-3 py-1.5 text-xs">
          <FlowCurrency currency={currency} size={18} />
          {formatMoney(total ?? result.funding_amount, currency)} · {currency} balance
        </span>
      </div>
      <div className="rounded-2xl border border-[#eaecf0] px-4">
        <FlowRow label="Payment type">{label}</FlowRow>
        <FlowRow label="Recipient gets">{amount}</FlowRow>
        <FlowRow label="Status">{result.status}</FlowRow>
        <FlowRow label="Funded amount">{formatMoney(result.funding_amount,currency)}</FlowRow>
        {confirmedQuote?.fees.map(f=><FlowRow key={f.code} label={f.label}>{formatMoney(f.amount.amount,f.amount.currency)}</FlowRow>)}
        {total && <FlowRow label={`Total ${currency} deducted`}>{formatMoney(total,currency)}</FlowRow>}
        {confirmedQuote && <FlowRow label="Rate">1 {confirmedQuote.rate.base_currency} = {confirmedQuote.rate.value} {confirmedQuote.rate.quote_currency}</FlowRow>}
        <FlowRow label="Reference">
          {result.alipay_wechat_transaction_request_id}
        </FlowRow>
      </div>
      <FlowActions
        tone="purple"
        onBack={onDone}
        backLabel="Done"
        onNext={copyReceipt}
        nextLabel="Copy payment details"
      />
    </FlowCard>
  );
}
