"use client";
import { useState } from "react";
import Image from "next/image";
import { useQueries } from "@tanstack/react-query";
import { QuoteChinaPayApi } from "@/services/chinaPay";
import type { ChinaPayChannel, ChinaPayQuote } from "@/types/chinaPay";
import type { BalanceCurrency } from "@/types/globalBalance";
import type { IAlipayWechatBeneficiary } from "@/types/services";
import {
  FlowHeader,
  FlowCard,
  FlowRecipient,
  FlowAmount,
  FlowRow,
  FlowCurrency,
  FlowActions,
} from "@/components/transactions/send-flow/Flow";
import Overlay from "@/components/ui/Overlay";
import { useUser } from "@/lib/hooks/useUser";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useQuoteSeconds } from "@/lib/hooks/useQuoteSeconds";
import { spendableBalances, formatMoney } from "@/lib/globalBalance";
import {
  chinaPayError,
  compareDecimalAmounts,
  usableChinaPayQuote,
} from "@/utils/chinaPayQuote";

interface Props {
  channel: ChinaPayChannel;
  beneficiary: IAlipayWechatBeneficiary;
  initialAmount: string;
  fundingCurrency: BalanceCurrency;
  onFundingChange: (currency: BalanceCurrency) => void;
  onConfirm: (amount: string, quote: ChinaPayQuote) => void;
  onBack: () => void;
}
// Only NGN is backed by a deployed quote/send API today. Keeping USD out of
// this list also prevents useQueries from speculatively calling the proposed
// `/v2/alipay-wechat/quotes/` route and disabling the valid NGN flow.
const currencies: BalanceCurrency[] = ["NGN"];
export default function AmountEntry({
  channel,
  beneficiary,
  initialAmount,
  fundingCurrency,
  onFundingChange,
  onConfirm,
  onBack,
}: Props) {
  const [amount, setAmount] = useState(initialAmount);
  const [choosing, setChoosing] = useState(false);
  const [choice, setChoice] = useState(fundingCurrency);
  const { user } = useUser();
  const balances = spendableBalances(user?.business_account);
  const debouncedAmount = useDebounce(amount, 600);
  const validAmount =
    /^\d+(\.\d{0,2})?$/.test(amount) &&
    compareDecimalAmounts(amount.endsWith(".") ? amount + "0" : amount, "0") >
      0;
  const queries = useQueries({
    queries: currencies.map((currency) => ({
      queryKey: [
        "china-pay-quote",
        beneficiary.alipay_wechat_beneficiary_id,
        channel,
        currency,
        debouncedAmount,
      ],
      queryFn: () =>
        QuoteChinaPayApi(
          {
            channel,
            destination_amount: debouncedAmount,
            funding_currency: currency,
          },
          crypto.randomUUID(),
        ),
      enabled:
        validAmount &&
        amount === debouncedAmount &&
        balances.some((b) => b.currency === currency),
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    })),
  });
  const query = queries[currencies.indexOf(fundingCurrency)];
  const request = {
    channel,
    destination_amount: amount,
    funding_currency: fundingCurrency,
  };
  const seconds = useQuoteSeconds(query.data?.expires_at);
  const quote =
    amount === debouncedAmount && usableChinaPayQuote(query.data, request)
      ? query.data
      : undefined;
  const balance = balances.find((b) => b.currency === fundingCurrency);
  const insufficient =
    !!quote &&
    compareDecimalAmounts(
      quote.total_debit.amount,
      balance?.available_balance ?? "0",
    ) > 0;
  const loading =
    validAmount && (amount !== debouncedAmount || query.isFetching);
  const expired = !!query.data && amount === debouncedAmount && seconds === 0;
  const ready = !!quote && !loading && !insufficient && !!balance;
  return (
    <>
      <FlowHeader title="China Pay" onBack={onBack} />
      <FlowCard>
        <FlowRecipient
          name={beneficiary.name}
          detail={`${channel === "alipay" ? "Alipay" : "WeChat Pay"} · ${beneficiary.phone_number || beneficiary.email}`}
          countryBadge="CNY"
          onChange={onBack}
        />
        <FlowAmount
          currency="CNY"
          amount={amount}
          recipient={beneficiary.name}
          onChange={setAmount}
        />
        <div className="flex flex-col gap-4 [@media(max-height:800px)]:gap-0 max-md:gap-0">
          <FlowRow label="Rate">
            {quote
              ? `1 ${quote.rate.base_currency} = ${Number(quote.rate.value)?.toFixed(2)} ${quote.rate.quote_currency}`
              : "—"}
          </FlowRow>
          <FlowRow label="Arrives">After processing</FlowRow>
          <FlowRow label="You send">
            {loading
              ? "Getting quote…"
              : formatMoney(quote?.funding_money.amount, fundingCurrency)}
          </FlowRow>
          {quote?.fees.length ? (
            quote.fees.map((f) => (
              <FlowRow key={f.code} label={f.label}>
                {formatMoney(f.amount.amount, f.amount.currency)}
              </FlowRow>
            ))
          ) : (
            <FlowRow label="Fee">{quote ? "Free" : "—"}</FlowRow>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setChoice(fundingCurrency);
            setChoosing(true);
          }}
          className="flex items-center gap-3 rounded-2xl border border-[#eaecf0] px-4 py-3.5 text-left"
        >
          <FlowCurrency currency={fundingCurrency} size={32} />
          <span className="flex-1">
            <span className="block text-[13px]">
              Pay from {fundingCurrency}
            </span>
            <span className="block text-xs text-[#79708d]">
              Bal. {formatMoney(balance?.available_balance, fundingCurrency)}
            </span>
          </span>
          <strong className="text-2xl">
            {formatMoney(quote?.total_debit.amount, fundingCurrency)}
          </strong>
          <Image
            src="/images/send/arrow-down.svg"
            width={20}
            height={20}
            alt="Change funding balance"
          />
        </button>
        {insufficient && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-600"
          >
            Not enough {fundingCurrency}. Choose another balance, add money, or
            enter a lower amount.
          </p>
        )}
        {query.isError && amount === debouncedAmount && (
          <p role="alert" className="text-sm text-red-600">
            {chinaPayError(query.error).message}{" "}
            <button
              type="button"
              className="underline"
              onClick={() => query.refetch()}
            >
              Try again
            </button>
          </p>
        )}
        {expired && (
          <p role="alert" className="text-sm text-red-600">
            Rate expired.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => query.refetch()}
            >
              Get a new rate
            </button>
          </p>
        )}
        <FlowActions
          tone="purple"
          disabled={!ready}
          loading={loading}
          onNext={() => {
            if (ready && quote && usableChinaPayQuote(quote, request))
              onConfirm(amount, quote);
          }}
        />
      </FlowCard>
      {choosing && (
        <Overlay close={() => setChoosing(false)} width="520px">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Pay from"
            className="flex flex-col gap-5 p-7 max-md:p-5"
          >
            <div className="flex justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Pay from</h2>
                <p className="mt-1 text-sm text-[#79708d]">
                  They get {formatMoney(amount || "0", "CNY")} either way
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChoosing(false)}
                aria-label="Close funding picker"
                className="self-start text-xl text-[#79708d]"
              >
                ×
              </button>
            </div>
            {currencies.map((currency, index) => {
              const available = balances.find((b) => b.currency === currency);
              const result = queries[index];
              const option = usableChinaPayQuote(result.data, {
                channel,
                destination_amount: amount,
                funding_currency: currency,
              })
                ? result.data
                : undefined;
              return (
                <button
                  key={currency}
                  type="button"
                  aria-pressed={choice === currency}
                  disabled={!available}
                  onClick={() => setChoice(currency)}
                  className={`flex items-center gap-3.5 rounded-2xl border px-[18px] py-4 text-left disabled:opacity-50 ${choice === currency ? "border-primary2 bg-[#f3f1fd]" : "border-[#eaecf0]"}`}
                >
                  <FlowCurrency currency={currency} size={36} />
                  <span className="flex-1">
                    <strong className="block text-sm">
                      {currency} balance
                    </strong>
                    <span className="block text-xs text-[#79708d] mt-1">
                      {available
                        ? `${formatMoney(available.available_balance, currency)} · You pay ${formatMoney(option?.total_debit.amount, currency)}`
                        : "Balance unavailable"}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={`size-[22px] rounded-full border-2 ${choice === currency ? "border-primary2 bg-primary2 ring-4 ring-inset ring-white" : "border-[#c9c5d4]"}`}
                  />
                </button>
              );
            })}
            <p className="flex items-center gap-2 text-xs text-[#79708d]">
              <Image
                src="/images/send/info.svg"
                width={16}
                height={16}
                alt=""
              />
              The fee and total are shown before you confirm.
            </p>
            <FlowActions
              tone="purple"
              onNext={() => {
                onFundingChange(choice);
                setChoosing(false);
              }}
            />
          </div>
        </Overlay>
      )}
    </>
  );
}
