"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Categories from "@/components/transactions/Categories";
import EnterPin from "@/components/transactions/EnterPin";
import {
  FlowActions,
  FlowAmount,
  FlowCard,
  FlowHeader,
  FlowRecipient,
  FlowRow,
  FlowTotal,
} from "@/components/transactions/send-flow/Flow";
import SendProcessing from "@/components/transactions/send-flow/SendProcessing";
import { spendableBalances, formatMoney } from "@/lib/globalBalance";
import { useUser } from "@/lib/hooks/useUser";
import { useQuoteSeconds } from "@/lib/hooks/useQuoteSeconds";
import {
  QuoteForeignPayoutApi,
  SendForeignPayoutApi,
} from "@/services/treasuryPayout";
import { useSendStore } from "@/store/Send";
import type {
  ForeignPayoutCurrency,
  TreasuryPayoutQuote,
  TreasuryPayoutResult,
} from "@/types/treasuryPayout";
import { getApiErrorMessage } from "@/utils/helpers";
import ForeignBeneficiaryFlow from "./ForeignBeneficiaryFlow";

type Step = "beneficiary" | "amount" | "category" | "review" | "pin" | "status";

export default function GlobalForeignSend({
  currency,
  close,
}: {
  currency: ForeignPayoutCurrency;
  close: () => void;
}) {
  const { user } = useUser();
  const qc = useQueryClient();
  const { foreignBeneficiary, amount, purpose, category, actions } =
    useSendStore();
  const [step, setStep] = useState<Step>(
    foreignBeneficiary ? "amount" : "beneficiary",
  );
  const [quote, setQuote] = useState<TreasuryPayoutQuote | null>(null);
  const [result, setResult] = useState<TreasuryPayoutResult | null>(null);
  const [error, setError] = useState("");
  const quoteKey = useRef(crypto.randomUUID());
  const sendKey = useRef(crypto.randomUUID());
  const usdBalance = Number(
    spendableBalances(user?.business_account).find(
      (item) => item.currency === "USD",
    )?.available_balance ?? 0,
  );
  const recipient = foreignBeneficiary?.foreign_currency_beneficiary;
  const beneficiaryId =
    foreignBeneficiary?.foreign_currency_beneficiary_id ?? "";
  const seconds = useQuoteSeconds(quote?.expires_at);
  const amountValid = /^\d+(\.\d{0,2})?$/.test(amount) && Number(amount) > 0;
  const fee = useMemo(
    () =>
      quote?.fees.reduce((sum, item) => sum + Number(item.amount.amount), 0) ??
      0,
    [quote],
  );

  const quoteMutation = useMutation({
    mutationFn: () =>
      QuoteForeignPayoutApi(
        {
          destination_currency: currency,
          destination_amount: amount,
          beneficiary_id: beneficiaryId,
        },
        quoteKey.current,
      ),
    onSuccess: (data) => {
      setQuote(data);
      setError("");
      setStep("category");
    },
    onError: (err) =>
      setError(
        getApiErrorMessage(
          err,
          "We couldn’t get a live quote. Please try again.",
        ),
      ),
  });
  const sendMutation = useMutation({
    mutationFn: (pin: string) =>
      SendForeignPayoutApi(
        {
          quote_id: quote!.quote_id,
          beneficiary_id: beneficiaryId,
          transaction_pin: pin,
          transaction_reason: purpose,
          transaction_category_id: category?.transaction_category_id,
        },
        sendKey.current,
      ),
    onMutate: () => {
      setError("");
      setStep("status");
    },
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["transactions-report"] });
    },
    onError: (err) =>
      setError(getApiErrorMessage(err, "The transfer could not be submitted.")),
  });
  const resetQuote = () => {
    quoteKey.current = crypto.randomUUID();
    sendKey.current = crypto.randomUUID();
    setQuote(null);
    setStep("amount");
  };

  if (step === "beneficiary")
    return (
      <ForeignBeneficiaryFlow
        close={close}
        goNext={() => setStep("amount")}
        currency={currency}
      />
    );
  if (step === "category")
    return (
      <Categories
        goBack={() => setStep("amount")}
        goNext={() => setStep("review")}
        loading={false}
      />
    );
  if (step === "pin")
    return (
      <EnterPin
        pin=""
        setPin={(pin) => sendMutation.mutate(pin)}
        close={() => setStep("review")}
        disabled={!quote || seconds <= 0}
        error={error}
        onNewQuote={seconds <= 0 ? resetQuote : undefined}
        transfer={{
          recipient: recipient?.account_name ?? "beneficiary",
          amount,
          currency,
          debit: quote?.total_debit.amount,
          sourceCurrency: "USD",
        }}
      />
    );
  if (step === "status") {
    const pending = sendMutation.isPending;
    const failed = !!error;
    const recipientName = recipient?.account_name ?? "beneficiary";
    if (pending) {
      return (
        <SendProcessing
          title={`Sending ${formatMoney(amount, currency)} to ${recipientName}`}
        />
      );
    }
    return (
      <>
        <FlowHeader
          title={
            failed
              ? "Transfer didn’t go through"
              : "Your transfer is on its way"
          }
          onBack={failed ? () => setStep("review") : close}
        />
        <FlowCard className="items-center text-center !gap-5 !pt-9">
          <div
            className={`size-24 rounded-full flex items-center justify-center ${failed ? "bg-[#fff0ee]" : "bg-[#eaecff]"}`}
          >
            <span className="text-4xl">{failed ? "!" : "✓"}</span>
          </div>
          <h2 className="text-[28px] font-semibold">
            {failed ? error : `${formatMoney(amount, currency)} submitted`}
          </h2>
          {result?.transaction_report?.transaction_reference && (
            <p className="text-sm text-[#79708d]">
              Reference {result.transaction_report.transaction_reference}
            </p>
          )}
          <FlowActions
            onNext={failed ? () => setStep("review") : close}
            nextLabel={failed ? "Check details and try again" : "Done"}
          />
        </FlowCard>
      </>
    );
  }
  if (step === "review" && quote)
    return (
      <>
        <FlowHeader
          title="Review your transfer"
          onBack={() => setStep("category")}
        />
        <FlowCard>
          <p className="text-4xl font-semibold">
            {formatMoney(quote.total_debit.amount, "USD")}
          </p>
          <p className="text-sm text-[#79708d]">
            Total USD deducted from your balance
          </p>
          <FlowRow label="To">{recipient?.account_name}</FlowRow>
          <FlowRow label="Bank">{recipient?.bank_name}</FlowRow>
          <FlowRow label="You send">
            {formatMoney(quote.usd_principal.amount, "USD")}
          </FlowRow>
          <FlowRow label="Fee">{formatMoney(fee, "USD")}</FlowRow>
          <FlowRow label="Total USD deducted">
            {formatMoney(quote.total_debit.amount, "USD")}
          </FlowRow>
          <FlowRow label="Rate">
            {currency} 1 = USD {quote.rate.value}
          </FlowRow>
          <FlowRow label="Recipient gets">
            {formatMoney(quote.destination_money.amount, currency)}
          </FlowRow>
          <p
            className={`text-xs ${seconds <= 0 ? "text-[#d92d20]" : "text-[#79708d]"}`}
          >
            {seconds > 0
              ? `Quote valid for ${seconds}s`
              : "This quote has expired."}
          </p>
          <FlowActions
            onBack={() => setStep("category")}
            onNext={() => setStep("pin")}
            disabled={
              seconds <= 0 || Number(quote.total_debit.amount) > usdBalance
            }
            nextLabel={`Send ${formatMoney(amount, currency)}`}
          />
          {seconds <= 0 && (
            <FlowActions onNext={resetQuote} nextLabel="Get new quote" />
          )}
        </FlowCard>
      </>
    );
  return (
    <>
      <FlowHeader
        title="Send money"
        onBack={() => {
          actions.selectForeignBeneficiary(null);
          setStep("beneficiary");
        }}
      />
      <FlowCard>
        <FlowRecipient
          name={recipient?.account_name ?? ""}
          detail={`${recipient?.bank_name ?? "Bank"} · ${recipient?.iban ? "IBAN" : "Account"} · ••${(recipient?.iban || recipient?.account_number || "").slice(-4)} · ${currency}`}
          countryBadge={currency}
          onChange={() => setStep("beneficiary")}
        />
        <FlowAmount
          currency={currency}
          amount={amount}
          recipient={recipient?.account_name ?? "recipient"}
          onChange={(value) =>
            actions.setAmountAndRemark({ amount: value, purpose })
          }
        />
        <FlowRow label="Indicative rate">Calculated in your live quote</FlowRow>
        <FlowRow label="Arrives">1–2 working days</FlowRow>
        <FlowRow label="You send">Calculated in USD</FlowRow>
        <FlowRow label="Fee">Calculated in your live quote</FlowRow>
        <FlowTotal currency="USD" balance={usdBalance} />
        {error && (
          <p role="alert" className="text-sm text-[#d92d20]">
            {error}
          </p>
        )}
        <FlowActions
          onNext={() => quoteMutation.mutate()}
          disabled={!amountValid}
          loading={quoteMutation.isPending}
          nextLabel="Get quote"
        />
      </FlowCard>
    </>
  );
}
