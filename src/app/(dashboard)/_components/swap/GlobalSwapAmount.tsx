"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { formatMoney } from "@/lib/globalBalance";
import { formatCountdown } from "@/lib/swapQuote";
import type { SwapPairCurrency, SwapPreview } from "@/types/swap";
import {
  CurrencyFlag,
  DesignIcon,
} from "@/app/(dashboard)/_components/global/GlobalUI";

interface Props {
  sourceCurrency: SwapPairCurrency;
  destinationCurrency: SwapPairCurrency;
  sourceBalance: string;
  destinationBalance: string;
  amount: string;
  displayAmount: string;
  preview: SwapPreview | null;
  rateLabel: string | null;
  rateLoading: boolean;
  timeLeft: number;
  loading: boolean;
  insufficient: boolean;
  onAmountChange: (raw: string) => void;
  onUseMax: () => void;
  onFlip: () => void;
  onContinue: () => void;
  onBack: () => void;
}

function CurrencyChip({ currency }: { currency: SwapPairCurrency }) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#f4f4f8] py-1.5 pl-2 pr-3.5">
      <CurrencyFlag currency={currency} compact />
      <span className="text-sm font-semibold text-[#19151e]">{currency}</span>
    </div>
  );
}

/** Format a raw decimal string with thousand separators for the input. */
function formatInputAmount(raw: string): string {
  if (!raw) return "";
  const [integer = "0", decimal] = raw.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (decimal !== undefined) return `${grouped}.${decimal}`;
  if (raw.endsWith(".")) return `${grouped}.`;
  return grouped;
}

function QuoteValueSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-3.5 animate-pulse rounded-md bg-[#e4e0ea] ${
        wide ? "w-28" : "w-16"
      }`}
    />
  );
}

export default function GlobalSwapAmount({
  sourceCurrency,
  destinationCurrency,
  sourceBalance,
  destinationBalance,
  amount,
  displayAmount,
  preview,
  rateLabel,
  rateLoading,
  timeLeft,
  loading,
  insufficient,
  onAmountChange,
  onUseMax,
  onFlip,
  onContinue,
  onBack,
}: Props) {
  const amountInputRef = useRef<HTMLInputElement>(null);
  const payingUsd = sourceCurrency === "USD";
  const continueLabel = insufficient ? "Enter a smaller amount" : "Continue";
  const canContinue =
    !insufficient &&
    !loading &&
    !!preview &&
    Number(amount) > 0 &&
    timeLeft > 0;
  const awaitingQuote = Number(amount) > 0 && (loading || !preview);

  useEffect(() => {
    amountInputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9.]/g, "");
    if (value.startsWith(".")) value = `0${value}`;
    if ((value.match(/\./g) || []).length > 1) return;
    const [, decimal] = value.split(".");
    if (decimal !== undefined && decimal.length > 2) return;
    onAmountChange(value);
  };

  const destinationDisplay = preview
    ? formatMoney(preview.destinationMoney.amount, destinationCurrency)
    : formatMoney("0", destinationCurrency);

  const feeDisplay = preview?.fee
    ? formatMoney(preview.fee.amount, preview.fee.currency)
    : "—";

  const totalDisplay = preview?.totalDebit
    ? formatMoney(preview.totalDebit.amount, preview.totalDebit.currency)
    : "—";

  const inputDisplay = formatInputAmount(displayAmount);

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 font-monzo">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-[13px] text-[#79708d]"
      >
        <DesignIcon name="32273-13049-imgVuesaxLinearArrowLeft.svg" />
        Dashboard
      </button>

      <h1 className="text-2xl font-semibold leading-[1.4] text-[#19151e]">
        Swap
      </h1>

      <div className="flex flex-col gap-5 overflow-hidden rounded-[20px] border border-[#eaecf0] bg-white p-5 sm:p-7">
        <div className="relative flex flex-col gap-2.5">
          <div
            className={`flex flex-col gap-3.5 overflow-hidden rounded-2xl border px-5 py-[18px] ${
              insufficient
                ? "border-[#f04438] bg-[#fef3f2]"
                : "border-[#eaecf0] bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <p className="text-[13px] text-[#6b6b80]">You swap</p>
              <div className="min-w-0 flex-1" />
              <button
                type="button"
                onClick={onUseMax}
                className="text-[13px] font-semibold text-[#3c2875]"
              >
                Use max
              </button>
            </div>
            <div className="flex items-center gap-3">
              <CurrencyChip currency={sourceCurrency} />
              <div className="min-w-0 flex-1" />
              <div className="flex min-w-0 items-baseline justify-end">
                <span className="text-[32px] font-bold text-[#19151e]">
                  {sourceCurrency === "USD" ? "$" : "₦"}
                </span>
                <input
                  ref={amountInputRef}
                  inputMode="decimal"
                  aria-label="Swap amount"
                  value={inputDisplay}
                  onChange={handleChange}
                  placeholder="0.00"
                  autoFocus
                  className="w-full min-w-[5ch] max-w-[16ch] bg-transparent text-right text-[32px] font-bold text-[#19151e] outline-none placeholder:text-[#19151e]/40"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p
                className={`text-xs ${insufficient ? "text-[#f04438]" : "text-[#6b6b80]"}`}
              >
                Balance: {formatMoney(sourceBalance, sourceCurrency)}
              </p>
              <div className="min-w-0 flex-1" />
              {insufficient && (
                <p className="text-xs font-medium text-[#f04438]">
                  More than your balance
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3.5 overflow-hidden rounded-2xl border border-[#eaecf0] bg-white px-5 py-[18px]">
            <div className="flex items-center gap-3">
              <p className="text-[13px] text-[#6b6b80]">You get</p>
            </div>
            <div className="flex items-center gap-3">
              <CurrencyChip currency={destinationCurrency} />
              <div className="min-w-0 flex-1" />
              {awaitingQuote ? (
                <span
                  aria-busy="true"
                  aria-label="Loading destination amount"
                  className="inline-block h-8 w-36 animate-pulse rounded-lg bg-[#e8e5ef]"
                />
              ) : (
                <p className="text-[32px] font-bold text-[#3c2875]">
                  {destinationDisplay}
                </p>
              )}
            </div>
            <p className="text-xs text-[#6b6b80]">
              Balance: {formatMoney(destinationBalance, destinationCurrency)}
            </p>
          </div>

          <button
            type="button"
            aria-label="Flip swap direction"
            onClick={onFlip}
            className="absolute left-1/2 top-1/2 z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[22px] border-4 border-white bg-[#3c2875]"
          >
            <Image
              src="/images/dashboard/32554-swap-flip.svg"
              alt=""
              width={20}
              height={20}
              className="-rotate-90"
            />
          </button>
        </div>

        <div
          className="flex flex-col gap-3.5 rounded-2xl bg-[#f8f8fb] px-5 py-[18px]"
          aria-busy={awaitingQuote || rateLoading}
        >
          <div className="flex items-center gap-3 text-[13px]">
            <span className="text-[#6b6b80]">Rate</span>
            <div className="min-w-0 flex-1" />
            {rateLoading ? (
              <QuoteValueSkeleton wide />
            ) : (
              <span className="font-semibold text-[#19151e]">
                {rateLabel ?? "—"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[13px]">
            <span className="text-[#6b6b80]">Fee</span>
            <div className="min-w-0 flex-1" />
            {awaitingQuote ? (
              <QuoteValueSkeleton />
            ) : (
              <span className="font-semibold text-[#19151e]">{feeDisplay}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[13px]">
            <span className="text-[#6b6b80]">Total deducted</span>
            <div className="min-w-0 flex-1" />
            {awaitingQuote ? (
              <QuoteValueSkeleton />
            ) : (
              <span className="text-[15px] font-bold text-[#19151e]">
                {totalDisplay}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex items-center gap-1.5 rounded-full bg-[#f3f1fd] py-1.5 pl-2.5 pr-3">
            <Image
              src="/images/dashboard/32554-swap-clock.svg"
              alt=""
              width={14}
              height={14}
            />
            <span className="text-xs font-semibold text-[#3c2875]">
              Rate refreshes in {formatCountdown(timeLeft)}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Image
            src="/images/dashboard/32554-swap-info.svg"
            alt=""
            width={16}
            height={16}
            className="mt-0.5 shrink-0"
          />
          <p className="text-xs leading-normal text-[#6b6b80]">
            Swap works between NGN and USD. GBP, EUR, USDT and USDC come in and
            go out through your USD balance.
          </p>
        </div>

        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className={`flex h-12 w-full items-center justify-center rounded-xl px-6 text-[15px] font-semibold transition ${
            insufficient || !canContinue
              ? "cursor-not-allowed bg-[#e4e0ea] text-[#6b6b80]"
              : payingUsd
                ? "bg-[#0d6494] text-white hover:brightness-110"
                : "bg-[#3c2875] text-white hover:brightness-110"
          }`}
        >
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
