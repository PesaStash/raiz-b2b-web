"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { IAlipayWechatBeneficiary } from "@/types/services";
import type {
  ChinaPayChannel,
  ChinaPayQuote,
  ChinaPayResult,
} from "@/types/chinaPay";
import type { BalanceCurrency } from "@/types/globalBalance";
import {
  QuoteChinaPayApi,
  SendChinaPayApi,
  SendLegacyChinaPayApi,
} from "@/services/chinaPay";
import { chinaPayError, usableChinaPayQuote } from "@/utils/chinaPayQuote";
import { useQuoteSeconds } from "@/lib/hooks/useQuoteSeconds";
import {
  trackMoneyMovementSuccess,
  getTransactionId,
} from "@/utils/analytics/dataLayer";
import {
  FlowCard,
  FlowActions,
} from "@/components/transactions/send-flow/Flow";
import SendProcessing from "@/components/transactions/send-flow/SendProcessing";
import { getCurrencySymbol } from "@/utils/helpers";
import ChannelSelect from "./ChannelSelect";
import AmountEntry from "./AmountEntry";
import BeneficiarySelect from "./BeneficiarySelect";
import AlipayWechatSummary from "./AlipayWechatSummary";
import AlipayWechatPay from "./AlipayWechatPay";
import AlipayWechatStatus from "./AlipayWechatStatus";
type Step = "channel" | "beneficiary" | "amount" | "summary" | "pay" | "status";
interface Props {
  close: () => void;
  onPastChannelChange?: (past: boolean) => void;
}
export default function AlipayWechatSend({
  close,
  onPastChannelChange,
}: Props) {
  const [step, setStep] = useState<Step>("channel");
  const [channel, setChannel] = useState<ChinaPayChannel>("alipay");
  // The deployed China Pay APIs currently debit NGN only. Do not request the
  // proposed USD v2 quote endpoint until that contract is available server-side.
  const [funding, setFunding] = useState<BalanceCurrency>("NGN");
  const [amount, setAmount] = useState("");
  const [beneficiary, setBeneficiary] =
    useState<IAlipayWechatBeneficiary | null>(null);
  const [quote, setQuote] = useState<ChinaPayQuote | null>(null);
  const [result, setResult] = useState<ChinaPayResult | null>(null);
  const [error, setError] = useState("");
  const [serverExpired, setServerExpired] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const actionKey = useRef<{
    quoteId: string;
    beneficiaryId: string;
    key: string;
  } | null>(null);
  const seconds = useQuoteSeconds(quote?.expires_at);
  const expired = serverExpired || seconds === 0;
  const qc = useQueryClient();
  useEffect(() => {
    onPastChannelChange?.(step !== "channel");
  }, [step, onPastChannelChange]);
  const request = {
    channel,
    destination_amount: amount,
    funding_currency: funding,
  };
  const refresh = useMutation({
    mutationFn: () => QuoteChinaPayApi(request, crypto.randomUUID()),
    onMutate: () => {
      setError("");
      setStep("summary");
    },
    onSuccess: (fresh) => {
      if (!usableChinaPayQuote(fresh, request)) {
        setError(
          "The quote is unavailable or expired. Please request a new rate.",
        );
        return;
      }
      setQuote(fresh);
      setServerExpired(false);
      actionKey.current = null;
    },
    onError: (e) => setError(chinaPayError(e).message),
  });
  const send = useMutation({
    mutationFn: async (pin: string) => {
      if (
        !quote ||
        !beneficiary ||
        serverExpired ||
        !usableChinaPayQuote(quote, request)
      )
        throw new Error(
          "The quote expired. Get a new rate before authorising.",
        );
      if (
        !actionKey.current ||
        actionKey.current.quoteId !== quote.quote_id ||
        actionKey.current.beneficiaryId !==
          beneficiary.alipay_wechat_beneficiary_id
      )
        actionKey.current = {
          quoteId: quote.quote_id,
          beneficiaryId: beneficiary.alipay_wechat_beneficiary_id,
          key: crypto.randomUUID(),
        };
      if (quote.legacy) {
        return SendLegacyChinaPayApi({
          beneficiary_id: beneficiary.alipay_wechat_beneficiary_id,
          channel,
          amount,
          transaction_pin: pin,
        });
      }
      return SendChinaPayApi(
        {
          quote_id: quote.quote_id,
          beneficiary_id: beneficiary.alipay_wechat_beneficiary_id,
          transaction_pin: pin,
        },
        actionKey.current.key,
      );
    },
    retry: false,
    onMutate: () => {
      setError("");
      setUncertain(false);
      setStep("status");
    },
    onSuccess: (response) => {
      setResult(response);
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["transactions-report"] });
      qc.invalidateQueries({ queryKey: ["today-outflow"] });
      if (response.status === "completed") {
        const id = getTransactionId(response);
        if (id)
          trackMoneyMovementSuccess({
            event: "send_completed",
            transactionId: id,
            value: Number(response.funding_amount),
            currency: response.funding_currency,
            extra: { recipient_type: "external" },
          });
      }
    },
    onError: (e) => {
      const failure = chinaPayError(e);
      setError(failure.message);
      if (
        failure.code === "quote_expired" ||
        (quote && !usableChinaPayQuote(quote, request))
      ) {
        setServerExpired(true);
        setStep("summary");
        actionKey.current = null;
        return;
      }
      if (
        !failure.status ||
        failure.status >= 500 ||
        failure.code === "quote_already_used" ||
        failure.code === "idempotency_conflict"
      ) {
        setUncertain(true);
        return;
      }
      actionKey.current = null;
    },
  });
  if (step === "channel")
    return (
      <ChannelSelect
        onBack={close}
        onSelect={(value) => {
          setChannel(value);
          setQuote(null);
          setStep("beneficiary");
        }}
      />
    );
  if (step === "beneficiary")
    return (
      <BeneficiarySelect
        channel={channel}
        onSelect={(value) => {
          setBeneficiary(value);
          setQuote(null);
          setStep("amount");
        }}
        onBack={() => setStep("channel")}
      />
    );
  if (step === "amount" && beneficiary)
    return (
      <AmountEntry
        channel={channel}
        beneficiary={beneficiary}
        initialAmount={amount}
        fundingCurrency={funding}
        onFundingChange={(value) => {
          setFunding(value);
          setQuote(null);
        }}
        onBack={() => setStep("beneficiary")}
        onConfirm={(value, newQuote) => {
          setAmount(value);
          setQuote(newQuote);
          setError("");
          setServerExpired(false);
          actionKey.current = null;
          setStep("summary");
        }}
      />
    );
  if (step === "status") {
    if (result)
      return (
        <AlipayWechatStatus
          result={result}
          beneficiary={beneficiary ?? undefined}
          quote={quote ?? undefined}
          error={error}
          onDone={close}
        />
      );
    if (send.isPending) {
      const destination = quote?.destination_money;
      const amountLabel = destination
        ? `${getCurrencySymbol(destination.currency)}${Number(destination.amount).toLocaleString()}`
        : amount;
      return (
        <SendProcessing
          title={`Sending ${amountLabel} to ${beneficiary?.name || "recipient"}`}
        />
      );
    }
    return (
      <FlowCard>
        <h1 className="text-2xl font-semibold">
          {uncertain
            ? "We’re checking your payment"
            : "Payment didn’t go through"}
        </h1>
        <p role="status" className="text-sm text-[#79708d]">
          {uncertain
            ? "We couldn’t confirm the outcome. Check your transaction history before trying another payment."
            : error}
        </p>
        <FlowActions
          tone="purple"
          onBack={uncertain ? undefined : close}
          backLabel="Done"
          onNext={
            uncertain
              ? close
              : () => {
                  setError("");
                  setStep("summary");
                }
          }
          nextLabel={uncertain ? "Done" : "Review payment"}
        />
      </FlowCard>
    );
  }
  if (!quote || !beneficiary) return null;
  const summary = (
    <AlipayWechatSummary
      beneficiary={beneficiary}
      quote={quote}
      seconds={seconds}
      expired={expired}
      refreshing={refresh.isPending}
      error={error}
      onRefresh={() => refresh.mutate()}
      onConfirm={() => {
        if (usableChinaPayQuote(quote, request) && !serverExpired)
          setStep("pay");
        else setServerExpired(true);
      }}
      onBack={() => setStep("amount")}
    />
  );
  return (
    <>
      {summary}
      {step === "pay" && !expired && (
        <AlipayWechatPay
          transfer={{
            recipient: beneficiary.name,
            amount: quote.destination_money.amount,
            currency: "CNY",
            sourceCurrency: funding,
            debit: quote.total_debit.amount,
          }}
          submitting={send.isPending}
          onSubmit={(pin) => {
            if (
              !send.isPending &&
              usableChinaPayQuote(quote, request) &&
              !serverExpired
            )
              send.mutate(pin);
            else {
              setServerExpired(true);
              setStep("summary");
            }
          }}
          onClose={() => setStep("summary")}
        />
      )}
    </>
  );
}
