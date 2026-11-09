"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import { useUser } from "@/lib/hooks/useUser";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { spendableBalances } from "@/lib/globalBalance";
import {
  debitIncreased,
  formatSwapRateLabel,
  isInsufficient,
  previewFromLiveRate,
  previewFromV2Quote,
  readQuoteExpiry,
  secondsUntil,
} from "@/lib/swapQuote";
import { GetExchangeRate } from "@/services/transactions";
import { isSwapApiUnavailable, QuoteSwapApi } from "@/services/swap";
import type {
  SwapExecuteResult,
  SwapPairCurrency,
  SwapPreview,
} from "@/types/swap";
import GlobalSwapAmount from "./GlobalSwapAmount";
import GlobalSwapConfirm from "./GlobalSwapConfirm";
import GlobalSwapPayment from "./GlobalSwapPayment";
import GlobalSwapSuccess from "./GlobalSwapSuccess";
import GlobalSwapReceipt from "./GlobalSwapReceipt";

type Step = "amount" | "confirm" | "pin" | "success" | "receipt";

interface Props {
  close: () => void;
  initialAmount?: string;
  initialSource?: SwapPairCurrency;
}

function parseDisplayAmount(value: string): string {
  return value.replace(/[^0-9.]/g, "");
}

function normalizeMaxAmount(balance: string): string {
  if (!/^\d+(\.\d+)?$/.test(balance)) return "";
  const [whole, fraction = ""] = balance.split(".");
  return `${whole}.${fraction.slice(0, 2).padEnd(2, "0")}`;
}

function extractReference(result: SwapExecuteResult): string {
  return (
    result.transaction_reference ||
    result.reference ||
    result.transaction_id ||
    result.quote_id ||
    ""
  );
}

export default function GlobalSwap({
  close,
  initialAmount,
  initialSource,
}: Props) {
  const { user } = useUser();
  const balances = spendableBalances(user?.business_account);
  const [sourceCurrency, setSourceCurrency] = useState<SwapPairCurrency>(
    initialSource === "NGN" || initialSource === "USD" ? initialSource : "USD",
  );
  const destinationCurrency: SwapPairCurrency =
    sourceCurrency === "USD" ? "NGN" : "USD";

  const [amount, setAmount] = useState(initialAmount ?? "");
  const [step, setStep] = useState<Step>("amount");
  const [preview, setPreview] = useState<SwapPreview | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [v2Available, setV2Available] = useState(true);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [reference, setReference] = useState("");
  const [quoteNotice, setQuoteNotice] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const quoteKeyRef = useRef("");
  const refreshingRef = useRef(false);
  const previewRef = useRef<SwapPreview | null>(null);

  const debouncedAmount = useDebounce(amount, 400);
  const sourceBalance =
    balances.find((b) => b.currency === sourceCurrency)?.available_balance ??
    "0";
  const destinationBalance =
    balances.find((b) => b.currency === destinationCurrency)
      ?.available_balance ?? "0";

  const {
    data: liveRate,
    isFetching: liveRateFetching,
    refetch: refetchLiveRate,
    isError: liveRateError,
  } = useQuery({
    queryKey: ["global-swap-exchange-rate", "NGN"],
    queryFn: () => GetExchangeRate("NGN"),
    staleTime: 30_000,
  });

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

  const applyLivePreview = useCallback(() => {
    if (!liveRate || !debouncedAmount || Number(debouncedAmount) <= 0) {
      setPreview(null);
      return;
    }
    const next = previewFromLiveRate(
      sourceCurrency,
      destinationCurrency,
      debouncedAmount,
      liveRate,
    );
    setPreview(next);
    if (next) setTimeLeft(secondsUntil(next.expiresAt));
  }, [liveRate, debouncedAmount, sourceCurrency, destinationCurrency]);

  const fetchQuote = useCallback(async () => {
    if (!debouncedAmount || Number(debouncedAmount) <= 0) {
      setPreview(null);
      return;
    }

    const requestKey = `${sourceCurrency}:${destinationCurrency}:${debouncedAmount}`;
    quoteKeyRef.current = requestKey;

    if (!v2Available) {
      applyLivePreview();
      return;
    }

    setQuoteLoading(true);
    try {
      const quote = await QuoteSwapApi(
        {
          source_currency: sourceCurrency,
          destination_currency: destinationCurrency,
          source_amount: debouncedAmount,
        },
        crypto.randomUUID(),
      );
      if (quoteKeyRef.current !== requestKey) return;
      const next = previewFromV2Quote(quote, sourceCurrency);
      if (!next) {
        // Unexpected quote shape — use the live rate path rather than crashing.
        setV2Available(false);
        applyLivePreview();
        return;
      }
      setPreview(next);
      const remaining = secondsUntil(next.expiresAt);
      setTimeLeft(remaining > 0 ? remaining : 30);
    } catch (error) {
      if (isSwapApiUnavailable(error)) {
        setV2Available(false);
        applyLivePreview();
        return;
      }
      if (previewRef.current) {
        setQuoteNotice("Could not refresh the rate. Review it and try again.");
        return;
      }
      toast.error("Could not get a swap quote. Please try again.");
      setPreview(null);
    } finally {
      setQuoteLoading(false);
    }
  }, [
    debouncedAmount,
    sourceCurrency,
    destinationCurrency,
    v2Available,
    applyLivePreview,
  ]);

  useEffect(() => {
    void fetchQuote();
  }, [fetchQuote]);

  useEffect(() => {
    if (!v2Available) applyLivePreview();
  }, [v2Available, applyLivePreview, liveRate]);

  useEffect(() => {
    if (liveRateError && !v2Available) {
      toast.error("Failed to fetch exchange rate. Please try again later.");
    }
  }, [liveRateError, v2Available]);

  const refreshExpiredQuote = useCallback(() => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    if (step === "confirm") {
      setQuoteNotice(
        "The rate changed. Review the updated quote before continuing.",
      );
    }
    const hasAmount = !!debouncedAmount && Number(debouncedAmount) > 0;
    const done = () => {
      refreshingRef.current = false;
    };
    if (hasAmount && v2Available) {
      void fetchQuote().finally(done);
      return;
    }
    void refetchLiveRate()
      .then(() => {
        if (hasAmount) applyLivePreview();
        else setTimeLeft(30);
      })
      .finally(done);
  }, [
    step,
    debouncedAmount,
    v2Available,
    fetchQuote,
    refetchLiveRate,
    applyLivePreview,
  ]);

  const applyReplacement = useCallback(
    (error: unknown) => {
      const expiry = readQuoteExpiry(error);
      const next = expiry.replacement
        ? previewFromV2Quote(expiry.replacement, sourceCurrency)
        : null;
      const previousDebit = previewRef.current?.totalDebit.amount;
      if (next) {
        setPreview(next);
        const remaining = secondsUntil(next.expiresAt);
        setTimeLeft(remaining > 0 ? remaining : 30);
      }
      const higher = next
        ? debitIncreased(previousDebit, next.totalDebit.amount)
        : false;
      setQuoteNotice(
        higher
          ? `${expiry.message} The amount deducted is higher, so confirm the new total before continuing.`
          : expiry.message,
      );
      setStep("confirm");
      if (!next) refreshExpiredQuote();
    },
    [sourceCurrency, refreshExpiredQuote],
  );

  useEffect(() => {
    if (step === "success" || step === "receipt" || step === "pin") return;
    if (timeLeft <= 0) {
      refreshExpiredQuote();
      return;
    }
    const id = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timeLeft, step, refreshExpiredQuote]);

  const liveRateLabel = (() => {
    if (!liveRate) return null;
    const rateValue = String(
      sourceCurrency === "USD" ? liveRate.sell_rate : liveRate.buy_rate,
    );
    const label = formatSwapRateLabel(sourceCurrency, rateValue);
    return label === "—" ? null : label;
  })();

  const rateLabel = preview?.rateLabel ?? liveRateLabel;
  const rateLoading = !rateLabel && liveRateFetching;

  const insufficient = isInsufficient(preview, sourceBalance);
  const loading = quoteLoading || (!v2Available && liveRateFetching);

  const handleAmountChange = (raw: string) => {
    const cleaned = parseDisplayAmount(raw);
    if ((cleaned.match(/\./g) || []).length > 1) return;
    const [, decimal] = cleaned.split(".");
    if (decimal !== undefined && decimal.length > 2) return;
    setAmount(cleaned);
  };

  const handleFlip = () => {
    setSourceCurrency(destinationCurrency);
    setPreview(null);
  };

  const handleContinue = () => {
    if (!preview || insufficient || timeLeft <= 0 || quoteLoading) return;
    setQuoteNotice(null);
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (!preview || timeLeft <= 0 || quoteLoading) {
      refreshExpiredQuote();
      return;
    }
    setQuoteNotice(null);
    setStep("pin");
  };

  if (!hydrated) return null;

  return (
    <CenterModalWrapper close={close} sendFlow>
      <GlobalSwapAmount
        sourceCurrency={sourceCurrency}
        destinationCurrency={destinationCurrency}
        sourceBalance={sourceBalance}
        destinationBalance={destinationBalance}
        amount={amount}
        displayAmount={amount}
        preview={preview}
        rateLabel={rateLabel}
        rateLoading={rateLoading}
        timeLeft={timeLeft}
        loading={loading}
        insufficient={insufficient}
        onAmountChange={handleAmountChange}
        onUseMax={() => {
          const next = normalizeMaxAmount(sourceBalance);
          if (next) setAmount(next);
        }}
        onFlip={handleFlip}
        onContinue={handleContinue}
        onBack={close}
      />
      {step === "confirm" &&
        preview &&
        createPortal(
          <GlobalSwapConfirm
            sourceCurrency={sourceCurrency}
            destinationCurrency={destinationCurrency}
            preview={preview}
            timeLeft={timeLeft}
            refreshing={quoteLoading}
            notice={quoteNotice}
            onConfirm={handleConfirm}
            onCancel={() => {
              setQuoteNotice(null);
              setStep("amount");
            }}
          />,
          document.body,
        )}
      {step === "pin" && preview && (
        <GlobalSwapPayment
          sourceCurrency={sourceCurrency}
          destinationCurrency={destinationCurrency}
          preview={preview}
          amount={amount}
          close={() => setStep("confirm")}
          onSuccess={(result) => {
            setReference(extractReference(result));
            setStep("success");
          }}
          onQuoteExpired={applyReplacement}
          onNewQuote={() => {
            refreshingRef.current = false;
            setQuoteNotice(
              "The rate changed. Review the updated quote before continuing.",
            );
            setStep("confirm");
            void fetchQuote();
          }}
        />
      )}
      {step === "success" &&
        preview &&
        createPortal(
          <GlobalSwapSuccess
            sourceCurrency={sourceCurrency}
            destinationCurrency={destinationCurrency}
            preview={preview}
            reference={reference}
            onDone={close}
            onViewReceipt={() => setStep("receipt")}
          />,
          document.body,
        )}
      {step === "receipt" &&
        preview &&
        createPortal(
          <GlobalSwapReceipt
            sourceCurrency={sourceCurrency}
            destinationCurrency={destinationCurrency}
            preview={preview}
            reference={reference}
            close={() => setStep("success")}
          />,
          document.body,
        )}
    </CenterModalWrapper>
  );
}
