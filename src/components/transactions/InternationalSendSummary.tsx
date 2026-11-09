"use client";
import { useSendStore } from "@/store/Send";
import React from "react";
import Image from "next/image";
import { formatTime, getCurrencySymbol, formatAmount } from "@/utils/helpers";
import {
  FlowHeader,
  FlowCard,
  FlowRow,
  FlowActions,
  FlowCurrency,
} from "./send-flow/Flow";
import { IInitialPayoutResponse } from "@/types/services";

interface Props {
  goBack: () => void;
  goNext: () => void;
  fee: number;
  paymentData?: IInitialPayoutResponse;
  timeLeft: number;
  isRequoting?: boolean;
  isExpired?: boolean;
  onRefresh?: () => void;
}
const InternationalSendSummary = ({
  goBack,
  goNext,
  fee,
  paymentData,
  timeLeft,
  isRequoting = false,
  isExpired = false,
  onRefresh,
}: Props) => {
  const { category, amount, purpose, intBeneficiary } = useSendStore();

  const payoutCurrency =
    paymentData?.payout_currency ||
    intBeneficiary?.foreign_payout_beneficiary?.beneficiary_currency ||
    "";
  const payoutAmount = paymentData?.payout_amount ?? Number(amount);
  const usdDebit = paymentData?.amount ?? 0;
  const totalUsdDebit = usdDebit + (paymentData?.fees ?? fee ?? 0);
  const quoteExpired = isExpired || timeLeft <= 0;

  return (
    <>
      <FlowHeader title="Review your transfer" onBack={goBack} />
      <FlowCard>
        <div className="flex gap-2.5 items-center">
          <FlowCurrency currency="USD" size={36} />
          <Image
            src="/images/send/chevron.svg"
            width={18}
            height={18}
            alt="to"
            className="rotate-180"
          />
          <FlowCurrency currency={payoutCurrency} size={36} />
        </div>
        <p className="text-4xl font-semibold">${formatAmount(totalUsdDebit)}</p>
        <p className="text-sm text-[#79708d]">
          Total USD deducted from your balance
        </p>
        <FlowRow label="To">
          {paymentData?.foreign_payout_beneficiary?.beneficiary_name ||
            intBeneficiary?.foreign_payout_beneficiary?.beneficiary_name}
        </FlowRow>
        <FlowRow label="Recipient account">
          {paymentData?.foreign_payout_beneficiary?.beneficiary_account_number}
        </FlowRow>
        <FlowRow label="You send">${formatAmount(usdDebit)}</FlowRow>
        <FlowRow label="Fee">${formatAmount(paymentData?.fees ?? fee)}</FlowRow>
        <FlowRow label="Total USD deducted">
          ${formatAmount(totalUsdDebit)}
        </FlowRow>
        <FlowRow label="Locked rate">
          {paymentData?.exchange_rate
            ? `1 USD = ${paymentData.exchange_rate} ${payoutCurrency}`
            : "Unavailable"}
        </FlowRow>
        {category && (
          <FlowRow label="Category">{category.transaction_category}</FlowRow>
        )}
        <FlowRow label="Purpose">{purpose}</FlowRow>
        <FlowRow label="Recipient gets">
          {getCurrencySymbol(payoutCurrency)}
          {formatAmount(payoutAmount)}
        </FlowRow>
        <div className="p-4 rounded-xl bg-[#f3f1fd] text-[13px]" role="status">
          <strong>
            {isRequoting
              ? "Refreshing quote…"
              : quoteExpired
                ? "Your quote has expired"
                : `Quote expires in ${formatTime(timeLeft)}`}
          </strong>
          <p className="text-xs text-[#79708d] mt-1.5">
            {quoteExpired
              ? "Refresh the quote and review the updated total before sending."
              : "The rate and total are held while you confirm."}
          </p>
          {quoteExpired && onRefresh && (
            <button
              type="button"
              disabled={isRequoting}
              onClick={onRefresh}
              className="text-primary2 font-semibold mt-3"
            >
              Refresh quote
            </button>
          )}
        </div>
        <FlowActions
          onBack={goBack}
          onNext={goNext}
          nextLabel={`Send ${getCurrencySymbol(payoutCurrency)}${formatAmount(payoutAmount)}`}
          disabled={quoteExpired || isRequoting}
          loading={isRequoting}
        />
      </FlowCard>
    </>
  );
};
export default InternationalSendSummary;
