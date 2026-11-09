"use client";
import Image from "next/image";
import type { IAlipayWechatBeneficiary } from "@/types/services";
import type { ChinaPayQuote } from "@/types/chinaPay";
import { FlowHeader, FlowCard, FlowCurrency, FlowRow, FlowActions } from "@/components/transactions/send-flow/Flow";
import { formatMoney } from "@/lib/globalBalance";
interface Props {
  beneficiary: IAlipayWechatBeneficiary;
  quote: ChinaPayQuote;
  seconds: number;
  expired: boolean;
  refreshing: boolean;
  error?: string;
  onRefresh: () => void;
  onConfirm: () => void;
  onBack: () => void;
}
export default function AlipayWechatSummary({beneficiary,quote,seconds,expired,refreshing,error,onRefresh,onConfirm,onBack}: Props) {
  const currency=quote.total_debit.currency;
  return <><FlowHeader title="Review payment" onBack={onBack}/><FlowCard>
    <div className="flex items-center gap-2.5"><FlowCurrency currency={currency} size={36}/><Image src="/images/send/route-arrow.svg" width={16} height={16} alt="to"/><FlowCurrency currency="CNY" size={36}/></div>
    <p className={`text-4xl font-semibold ${expired ? "text-[#9a9aad]" : ""}`}>{formatMoney(quote.destination_money.amount,"CNY")}</p>
    <p className="text-sm text-[#79708d]">Paying from your {currency} balance</p>
    <div className={`flex flex-col gap-4 [@media(max-height:800px)]:gap-0 max-md:gap-0 ${expired ? "opacity-50" : ""}`}>
      <FlowRow label="Recipient">{beneficiary.name} · {beneficiary.phone_number || beneficiary.email}</FlowRow>
      <FlowRow label="You send">{formatMoney(quote.funding_money.amount,quote.funding_money.currency)}</FlowRow>
      {quote.fees.length ? quote.fees.map(f=><FlowRow key={f.code} label={f.label}>{formatMoney(f.amount.amount,f.amount.currency)}</FlowRow>) : <FlowRow label="Fee">Free</FlowRow>}
      <FlowRow label={`Total ${currency} deducted`}>{formatMoney(quote.total_debit.amount,currency)}</FlowRow>
      <FlowRow label="Rate">1 {quote.rate.base_currency} = {quote.rate.value} {quote.rate.quote_currency}</FlowRow>
      <FlowRow label="Payment type">{quote.channel==="alipay" ? "Alipay" : "WeChat Pay"}</FlowRow>
      <FlowRow label="Recipient gets">{formatMoney(quote.destination_money.amount,"CNY")}</FlowRow>
    </div>
    {beneficiary.qr_code_url && <details className="rounded-xl border border-[#eaecf0] p-3 text-sm"><summary className="cursor-pointer text-primary2 font-semibold">View recipient QR code</summary><Image src={beneficiary.qr_code_url} alt="Recipient payment QR code" width={160} height={160} className="mx-auto mt-3 object-contain" unoptimized/></details>}
    <div role={expired ? "alert" : "status"} className={`rounded-xl px-4 py-3 ${expired ? "bg-red-50" : "bg-[#f3f1fd]"}`}><p className={`text-sm font-semibold ${expired ? "text-red-600" : "text-primary2"}`}>{expired ? "Rate expired" : `Rate held for ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`}</p><p className="mt-1 text-xs text-[#79708d]">{expired ? "Get a new rate to continue. Amounts may change." : "The rate and total are held while you confirm."}</p></div>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <p className="text-xs text-[#79708d]">Payouts are processed manually. Delivery is confirmed in the transaction status.</p>
    <FlowActions tone="purple" onBack={onBack} backLabel="Back" onNext={expired ? onRefresh : onConfirm} loading={refreshing} disabled={refreshing} nextLabel={expired ? "Get new rate" : "Continue"}/>
  </FlowCard></>;
}
