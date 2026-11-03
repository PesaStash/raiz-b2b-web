"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetExchangeRate } from "@/services/transactions";
import { conversionEstimate, formatMoney } from "@/lib/globalBalance";
import { BalanceCurrency } from "@/types/globalBalance";
import { CurrencyFlag, DesignIcon, primaryButton } from "./GlobalUI";
export default function ConvertCard({
  balances,
  visible,
  enabled,
  entityId,
  onConvert,
  onAddMoney,
}: {
  balances: Partial<Record<BalanceCurrency, string>>;
  visible: boolean;
  enabled: Partial<Record<BalanceCurrency, boolean>>;
  entityId?: string;
  onConvert: (amount: string, currency: BalanceCurrency) => void;
  onAddMoney: (currency: BalanceCurrency) => void;
}) {
  const [currency, setCurrency] = useState<BalanceCurrency>("USD");
  const balance = balances[currency];
  const [amount, setAmount] = useState("");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard-conversion-rate", entityId],
    queryFn: () => GetExchangeRate("NGN"),
    enabled: !!entityId,
    refetchInterval: 30_000,
  });
  const destination = currency === "USD" ? "NGN" : "USD";
  const rate = currency === "USD" ? data?.sell_rate : data?.buy_rate;
  const estimate = rate
    ? conversionEstimate(amount, String(rate), currency === "NGN")
    : undefined;
  const isZero = balance !== undefined && /^0+(\.0+)?$/.test(balance);
  const changeCurrency = (value: BalanceCurrency) => {
    setCurrency(value);
    setAmount("");
  };
  const selector = (value: BalanceCurrency, source: boolean) => (
    <div className="relative flex shrink-0 items-center gap-1.5 rounded-full border border-[#eaecf0] bg-white py-1 pl-1 pr-2">
      <CurrencyFlag currency={value} compact />
      <span className="text-[13px] font-semibold">{value}</span>
      <DesignIcon name="convert-arrow-down.svg" />
      <select
        aria-label={source ? "Convert from" : "Convert to"}
        value={value}
        onChange={(event) =>
          changeCurrency(
            source
              ? (event.target.value as BalanceCurrency)
              : event.target.value === "USD"
                ? "NGN"
                : "USD",
          )
        }
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option>USD</option>
        <option>NGN</option>
      </select>
    </div>
  );
  return (
    <section className="flex min-w-0 flex-col gap-5 rounded-2xl border border-[#eaecf0] bg-white p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Convert</h2>
          <p className="mt-0.5 text-xs text-kyb-muted">
            {currency} to {destination} at a live rate
          </p>
        </div>
        {data && !isError && (
          <span className="flex items-center gap-1.5 rounded-full bg-[#e8f6ee] px-2 py-[3px] text-[11px] font-semibold text-[#1f9d55]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1f9d55]" />
            Live rate
          </span>
        )}
      </header>
      <div className="flex flex-col gap-8">
        <div className="relative flex flex-col gap-1.5">
          <div className="flex flex-col gap-1.5 rounded-[14px] bg-[#f4f4f8] py-4 pl-4 pr-3.5">
            <label
              htmlFor="dashboard-conversion-amount"
              className="text-xs text-kyb-muted"
            >
              You convert
            </label>
            <div className="flex items-center gap-2">
              <input
                id="dashboard-conversion-amount"
                aria-label="Amount to convert"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(event) => {
                  if (/^\d{0,16}(\.\d{0,2})?$/.test(event.target.value))
                    setAmount(event.target.value);
                }}
                className="min-w-0 flex-1 bg-transparent text-[22px] font-semibold text-[#19151e] outline-none placeholder:text-[#19151e]"
              />
              {selector(currency, true)}
            </div>
            <p className="text-xs text-kyb-muted">
              Balance {visible ? formatMoney(balance, currency) : "••••••"}
            </p>
          </div>
          <button
            type="button"
            aria-label={`Switch conversion direction to ${destination} to ${currency}`}
            onClick={() => changeCurrency(destination)}
            className="absolute left-1/2 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-[#eaecf0] bg-white shadow-[0_2px_6px_rgba(26,20,51,0.08)] transition hover:bg-kyb-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary2"
          >
            <span className="-rotate-90">
              <DesignIcon name="convert-swap.svg" />
            </span>
          </button>
          <div className="flex flex-col gap-1.5 rounded-[14px] bg-[#f4f4f8] py-4 pl-4 pr-3.5">
            <p className="text-xs text-kyb-muted">You get (estimate)</p>
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 break-all text-[22px] font-semibold">
                {formatMoney(amount ? estimate : "0", destination)}
              </p>
              {selector(destination, false)}
            </div>
            <p className="text-xs text-kyb-muted">
              To your {destination} account
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[#eaecf0] rounded-xl bg-[#fafafc] py-3 text-center">
          <div className="min-w-0 px-1">
            <p className="text-[11px] text-kyb-muted">Rate</p>
            <div className="mt-[3px] break-words text-sm font-semibold">
              {isLoading ? (
                "Loading…"
              ) : isError ? (
                <button
                  onClick={() => refetch()}
                  className="text-primary2 underline"
                >
                  Retry
                </button>
              ) : (
                formatMoney(rate, "NGN")
              )}
            </div>
          </div>
          <div className="px-1">
            <p className="text-[11px] text-kyb-muted">Fee</p>
            <p className="mt-[3px] text-xs font-semibold">At confirmation</p>
          </div>
          <div className="px-1">
            <p className="text-[11px] text-kyb-muted">Arrives</p>
            <p className="mt-[3px] text-xs font-semibold">At confirmation</p>
          </div>
        </div>
      </div>
      <button
        disabled={
          !enabled[currency] ||
          (!isZero &&
            (!estimate || !/[1-9]/.test(amount) || isLoading || isError))
        }
        onClick={() =>
          isZero ? onAddMoney(currency) : onConvert(amount, currency)
        }
        className={`${primaryButton} mt-auto w-full disabled:!bg-[#e4e4ea] disabled:!text-[#8a8a9c] disabled:!opacity-100 ${currency === "NGN" ? "!bg-primary2" : ""}`}
      >
        {isZero ? "Add money to convert" : "Convert now"}
      </button>
    </section>
  );
}
