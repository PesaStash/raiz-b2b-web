"use client";

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
  preview: SwapPreview;
  timeLeft: number;
  refreshing?: boolean;
  notice?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function GlobalSwapConfirm({
  sourceCurrency,
  destinationCurrency,
  preview,
  timeLeft,
  refreshing = false,
  notice,
  onConfirm,
  onCancel,
}: Props) {
  const sourceLabel = formatMoney(
    preview.sourceMoney.amount,
    preview.sourceMoney.currency,
  );
  const destinationLabel = formatMoney(
    preview.destinationMoney.amount,
    preview.destinationMoney.currency,
  );
  const feeLabel = preview.fee
    ? formatMoney(preview.fee.amount, preview.fee.currency)
    : "—";
  const totalLabel = formatMoney(
    preview.totalDebit.amount,
    preview.totalDebit.currency,
  );
  const totalRowLabel = `Total ${preview.totalDebit.currency} deducted`;

  const rows: { label: string; value: string; emphasis?: boolean }[] = [
    { label: "You swap", value: sourceLabel },
    { label: "Rate", value: preview.rateLabel },
    { label: "Fee", value: feeLabel },
    { label: totalRowLabel, value: totalLabel },
    { label: "You get", value: destinationLabel, emphasis: true },
  ];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(14,11,22,0.45)] p-4 font-monzo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="swap-confirm-title"
        className="flex w-full max-w-[480px] flex-col items-center gap-5 rounded-3xl bg-white p-7 shadow-[0px_24px_64px_rgba(13,13,38,0.25)]"
      >
        <div className="flex items-center gap-2.5">
          <CurrencyFlag currency={sourceCurrency} large />
          <DesignIcon name="32555-swap-arrow-right.svg" />
          <CurrencyFlag currency={destinationCurrency} large />
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <h2
            id="swap-confirm-title"
            className="text-2xl font-bold text-[#19151e]"
          >
            {sourceLabel} → {destinationLabel}
          </h2>
          <p className="text-sm text-[#6b6b80]">
            Swap {sourceCurrency} to {destinationCurrency}
          </p>
        </div>

        <div className="w-full">
          {rows.map((row, index) => (
            <div
              key={row.label}
              className={`flex items-center gap-3 py-3 ${
                index < rows.length - 1 ? "border-b border-[#eeeef3]" : ""
              }`}
            >
              <span
                className={`text-sm whitespace-nowrap ${
                  row.emphasis
                    ? "font-semibold text-[#19151e]"
                    : "text-[#6b6b80]"
                }`}
              >
                {row.label}
              </span>
              <div className="min-w-0 flex-1" />
              <span
                className={`whitespace-nowrap text-[#19151e] ${
                  row.emphasis ? "text-base font-bold" : "text-sm font-semibold"
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {notice ? (
          <p
            role="status"
            className="w-full rounded-xl bg-[#fdf5e1] px-3 py-2 text-center text-sm font-medium text-[#8a5a00]"
          >
            {notice}
          </p>
        ) : null}

        <div className="flex items-center gap-1.5 rounded-full bg-[#f3f1fd] py-1.5 pl-2.5 pr-3">
          <Image
            src="/images/dashboard/32554-swap-clock.svg"
            alt=""
            width={14}
            height={14}
          />
          <span className="text-xs font-semibold text-[#3c2875]">
            {refreshing
              ? "Refreshing rate…"
              : timeLeft > 0
                ? `Rate locked for ${formatCountdown(timeLeft)}`
                : "Rate expired"}
          </span>
        </div>

        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={timeLeft <= 0 || refreshing}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#0d6494] px-6 text-[15px] font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? "Refreshing rate…" : "Confirm swap"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-12 w-full items-center justify-center rounded-xl border border-[#d0d5dd] bg-white px-6 text-[15px] font-semibold text-[#14141e]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
